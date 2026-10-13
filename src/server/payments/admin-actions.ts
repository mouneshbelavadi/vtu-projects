"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { rateLimit } from "@/server/security/rate-limit";
import { logAdminAction } from "@/server/audit";
import { sendEmail } from "@/server/email";
import { siteConfig } from "../../../site.config";
import { logger } from "@/server/log";

const approveSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
  last4Utr: z
    .string()
    .trim()
    .regex(/^[0-9]{4}$/, "Last 4 digits of UTR must be exactly 4 digits"),
});

const rejectReasons = [
  "Amount does not match",
  "UTR not found in bank record",
  "Screenshot unclear",
  "Duplicate payment",
  "Other",
] as const;

const rejectSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
  reason: z.enum(rejectReasons, {
    errorMap: () => ({ message: "Please select a valid rejection reason" }),
  }),
  note: z.string().max(300, "Note cannot exceed 300 characters").optional(),
});

const refundSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
  amountInr: z.number().int().positive("Refund amount must be greater than zero"),
  reference: z
    .string()
    .trim()
    .min(1, "Refund reference is required")
    .max(100, "Reference is too long"),
});

export interface AdminActionResult {
  success: boolean;
  errorMessage?: string;
}

/**
 * Creates a short-lived 60-second signed URL for the payment proof screenshot.
 * Returns null if no proof exists or if it has already been purged.
 */
export async function getPaymentProofSignedUrl(
  paymentId: string
): Promise<{ signedUrl: string | null; isPurged?: boolean }> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data: payment } = await adminClient
    .from("payments")
    .select("proof_path, proof_deleted_at")
    .eq("id", paymentId)
    .single();

  if (!payment) {
    return { signedUrl: null };
  }

  if (payment.proof_deleted_at || !payment.proof_path) {
    return { signedUrl: null, isPurged: !!payment.proof_deleted_at };
  }

  const { data, error } = await adminClient.storage
    .from("payment-proofs")
    .createSignedUrl(payment.proof_path, 60);

  if (error || !data?.signedUrl) {
    return { signedUrl: null };
  }

  return { signedUrl: data.signedUrl };
}

/**
 * Approves a pending payment after checking the last 4 digits of the UTR against bank records.
 * Atomically unlocks download grants and writes an audit row.
 */
export async function approvePaymentAction(params: {
  paymentId: string;
  last4Utr: string;
}): Promise<AdminActionResult> {
  const adminUser = await requireAdmin();

  // Rate limit: 60 actions per minute per admin
  const rateKey = `admin_action_${adminUser.user.id}`;
  const rate = await rateLimit(rateKey, 60, 60);
  if (!rate.allowed) {
    return { success: false, errorMessage: "Too many admin requests. Please wait a minute." };
  }

  const parsed = approveSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.errors[0]?.message };
  }

  const { paymentId, last4Utr } = parsed.data;
  const adminClient = createAdminClient();

  // Load payment details to compare last 4 digits
  const { data: payment, error: fetchErr } = await adminClient
    .from("payments")
    .select("id, order_id, utr, status, amount_inr")
    .eq("id", paymentId)
    .single();

  if (fetchErr || !payment) {
    return { success: false, errorMessage: "Payment record not found." };
  }

  if (payment.status !== "pending_verification") {
    return { success: false, errorMessage: "This payment has already been processed." };
  }

  // Refuse unless last 4 digits match stored UTR
  if (!payment.utr || !payment.utr.endsWith(last4Utr)) {
    return {
      success: false,
      errorMessage: "The last 4 digits do not match the stored UTR record.",
    };
  }

  // Call atomic approve_payment SQL function
  const { data: rpcRes, error: rpcErr } = await adminClient.rpc("approve_payment", {
    p_payment_id: paymentId,
    p_admin_id: adminUser.user.id,
  });

  if (rpcErr) {
    // Fallback if RPC function is not yet in migration cache
    const now = new Date().toISOString();
    await adminClient
      .from("payments")
      .update({
        status: "paid",
        verified_by: adminUser.user.id,
        verified_at: now,
      })
      .eq("id", paymentId)
      .eq("status", "pending_verification");

    await adminClient
      .from("orders")
      .update({ status: "paid", updated_at: now })
      .eq("id", payment.order_id);

    // Fetch order items to create grants
    const { data: items } = await adminClient
      .from("order_items")
      .select("project_id")
      .eq("order_id", payment.order_id);

    const { data: orderRow } = await adminClient
      .from("orders")
      .select("user_id, coupon_id")
      .eq("id", payment.order_id)
      .single();

    if (items && orderRow) {
      for (const it of items) {
        if (!it.project_id) continue;
        await adminClient.from("download_grants").upsert(
          {
            order_id: payment.order_id,
            user_id: orderRow.user_id,
            project_id: it.project_id,
            max_downloads: 5,
            download_count: 0,
            created_at: now,
          },
          { onConflict: "order_id,project_id" }
        );
      }

      if (orderRow.coupon_id) {
        await adminClient.from("coupon_redemptions").upsert(
          {
            coupon_id: orderRow.coupon_id,
            order_id: payment.order_id,
            created_at: now,
          },
          { onConflict: "order_id" }
        );
      }
    }

    await logAdminAction({
      actorId: adminUser.user.id,
      action: "approve_payment",
      entity: "payments",
      entityId: paymentId,
      details: { order_id: payment.order_id },
    });
  } else if (rpcRes === "already_processed") {
    return { success: false, errorMessage: "Payment was already processed." };
  } else if (rpcRes !== "ok") {
    return { success: false, errorMessage: `Payment approval failed: ${rpcRes}` };
  }

  // Dispatch payment_approved_student email asynchronously
  try {
    const { data: order } = await adminClient
      .from("orders")
      .select("id, order_code, user_id, order_items(label)")
      .eq("id", payment.order_id)
      .single();

    if (order) {
      const [userRes, profileRes] = await Promise.all([
        adminClient.auth.admin.getUserById(order.user_id),
        adminClient
          .from("profiles")
          .select("display_name")
          .eq("id", order.user_id)
          .maybeSingle(),
      ]);

      const studentEmail = userRes.data?.user?.email;
      if (studentEmail) {
        const studentDisplayName = profileRes.data?.display_name || "Student";
        const kitTitle = order.order_items?.[0]?.label || "Project Kit";
        const orderUrl = `${siteConfig.siteUrl}/account/orders/${order.id}`;

        await sendEmail(
          "payment_approved_student",
          studentEmail,
          {
            orderCode: order.order_code,
            studentDisplayName,
            kitTitle,
            amountInr: payment.amount_inr,
            orderUrl,
          },
          order.user_id
        );
      }
    }
  } catch {
    logger.warn("Post-approval email delivery skipped", { paymentId });
  }

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${paymentId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/account/orders/${payment.order_id}`);

  return { success: true };
}

/**
 * Rejects a submitted payment with a reason and optional note.
 */
export async function rejectPaymentAction(params: {
  paymentId: string;
  reason: (typeof rejectReasons)[number];
  note?: string;
}): Promise<AdminActionResult> {
  const adminUser = await requireAdmin();

  const rateKey = `admin_action_${adminUser.user.id}`;
  const rate = await rateLimit(rateKey, 60, 60);
  if (!rate.allowed) {
    return { success: false, errorMessage: "Too many admin requests. Please wait a minute." };
  }

  const parsed = rejectSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.errors[0]?.message };
  }

  const { paymentId, reason, note } = parsed.data;
  const adminClient = createAdminClient();

  const { data: payment } = await adminClient
    .from("payments")
    .select("id, order_id, status")
    .eq("id", paymentId)
    .single();

  if (!payment) {
    return { success: false, errorMessage: "Payment record not found." };
  }

  if (payment.status !== "pending_verification") {
    return { success: false, errorMessage: "Payment is no longer pending verification." };
  }

  const { data: rpcRes, error: rpcErr } = await adminClient.rpc("reject_payment", {
    p_payment_id: paymentId,
    p_admin_id: adminUser.user.id,
    p_reason: reason,
    p_note: note || null,
  });

  if (rpcErr) {
    const fullReason = note ? `${reason}: ${note.trim()}` : reason;
    const now = new Date().toISOString();
    await adminClient
      .from("payments")
      .update({
        status: "rejected",
        reject_reason: fullReason,
        verified_by: adminUser.user.id,
        verified_at: now,
      })
      .eq("id", paymentId);

    await adminClient
      .from("orders")
      .update({ status: "rejected", updated_at: now })
      .eq("id", payment.order_id);

    await logAdminAction({
      actorId: adminUser.user.id,
      action: "reject_payment",
      entity: "payments",
      entityId: paymentId,
      details: { order_id: payment.order_id, reason, note },
    });
  } else if (rpcRes === "already_processed") {
    return { success: false, errorMessage: "Payment was already processed." };
  } else if (rpcRes !== "ok") {
    return { success: false, errorMessage: `Payment rejection failed: ${rpcRes}` };
  }

  // Dispatch payment_rejected_student notification
  try {
    const { data: order } = await adminClient
      .from("orders")
      .select("id, order_code, user_id, order_items(label)")
      .eq("id", payment.order_id)
      .single();

    if (order) {
      const [userRes, profileRes] = await Promise.all([
        adminClient.auth.admin.getUserById(order.user_id),
        adminClient
          .from("profiles")
          .select("display_name")
          .eq("id", order.user_id)
          .maybeSingle(),
      ]);

      const studentEmail = userRes.data?.user?.email;
      if (studentEmail) {
        const studentDisplayName = profileRes.data?.display_name || "Student";
        const kitTitle = order.order_items?.[0]?.label || "Project Kit";
        const reorderUrl = `${siteConfig.siteUrl}/checkout/${order.id}`;

        await sendEmail(
          "payment_rejected_student",
          studentEmail,
          {
            orderCode: order.order_code,
            studentDisplayName,
            kitTitle,
            reason,
            note,
            reorderUrl,
          },
          order.user_id
        );
      }
    }
  } catch {
    logger.warn("Post-rejection email delivery skipped", { paymentId });
  }

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${paymentId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/account/orders/${payment.order_id}`);

  return { success: true };
}

/**
 * Records a refund for an order that was previously marked as paid.
 * Revokes all download grants for the order and writes an audit row.
 */
export async function refundPaymentAction(params: {
  paymentId: string;
  amountInr: number;
  reference: string;
}): Promise<AdminActionResult> {
  const adminUser = await requireAdmin();

  const rateKey = `admin_action_${adminUser.user.id}`;
  const rate = await rateLimit(rateKey, 60, 60);
  if (!rate.allowed) {
    return { success: false, errorMessage: "Too many admin requests. Please wait a minute." };
  }

  const parsed = refundSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.errors[0]?.message };
  }

  const { paymentId, amountInr, reference } = parsed.data;
  const adminClient = createAdminClient();

  const { data: payment } = await adminClient
    .from("payments")
    .select("id, order_id, status, amount_inr")
    .eq("id", paymentId)
    .single();

  if (!payment) {
    return { success: false, errorMessage: "Payment record not found." };
  }

  if (payment.status !== "paid") {
    return { success: false, errorMessage: "Only paid payments can be refunded." };
  }

  if (amountInr > payment.amount_inr) {
    return {
      success: false,
      errorMessage: `Refund amount cannot exceed the paid amount of ₹${payment.amount_inr}.`,
    };
  }

  const { data: rpcRes, error: rpcErr } = await adminClient.rpc("refund_payment", {
    p_payment_id: paymentId,
    p_admin_id: adminUser.user.id,
    p_amount_inr: amountInr,
    p_reference: reference,
  });

  if (rpcErr) {
    const now = new Date().toISOString();
    await adminClient
      .from("payments")
      .update({
        status: "refunded",
        refund_amount_inr: amountInr,
        refund_reference: reference,
        refunded_at: now,
      })
      .eq("id", paymentId);

    await adminClient
      .from("orders")
      .update({ status: "refunded", updated_at: now })
      .eq("id", payment.order_id);

    await adminClient
      .from("download_grants")
      .update({ revoked_at: now })
      .eq("order_id", payment.order_id)
      .is("revoked_at", null);

    await logAdminAction({
      actorId: adminUser.user.id,
      action: "refund_payment",
      entity: "payments",
      entityId: paymentId,
      details: {
        order_id: payment.order_id,
        refund_amount_inr: amountInr,
        reference,
      },
    });
  } else if (rpcRes === "not_paid") {
    return { success: false, errorMessage: "Payment is not marked as paid." };
  } else if (rpcRes === "amount_exceeds_paid") {
    return { success: false, errorMessage: "Refund amount exceeds paid amount." };
  } else if (rpcRes !== "ok") {
    return { success: false, errorMessage: `Refund recording failed: ${rpcRes}` };
  }

  // Dispatch refund_recorded_student notification
  try {
    const { data: order } = await adminClient
      .from("orders")
      .select("id, order_code, user_id, order_items(label)")
      .eq("id", payment.order_id)
      .single();

    if (order) {
      const [userRes, profileRes] = await Promise.all([
        adminClient.auth.admin.getUserById(order.user_id),
        adminClient
          .from("profiles")
          .select("display_name")
          .eq("id", order.user_id)
          .maybeSingle(),
      ]);

      const studentEmail = userRes.data?.user?.email;
      if (studentEmail) {
        const studentDisplayName = profileRes.data?.display_name || "Student";
        const kitTitle = order.order_items?.[0]?.label || "Project Kit";

        await sendEmail(
          "refund_recorded_student",
          studentEmail,
          {
            orderCode: order.order_code,
            studentDisplayName,
            kitTitle,
            refundAmountInr: amountInr,
            refundReference: reference,
          },
          order.user_id
        );
      }
    }
  } catch {
    logger.warn("Post-refund email delivery skipped", { paymentId });
  }

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${paymentId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/account/orders/${payment.order_id}`);

  return { success: true };
}
