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

export interface OrderAdminActionResult {
  success: boolean;
  errorMessage?: string;
}

const uuidSchema = z.string().uuid("Invalid identifier");

/**
 * Resends the order access email to the student.
 * Only permitted if the order is in 'paid' status.
 * Writes an audit row.
 */
export async function resendAccessEmailAction(
  orderId: string
): Promise<OrderAdminActionResult> {
  const adminUser = await requireAdmin();

  const rateKey = `admin_action_${adminUser.user.id}`;
  const rate = await rateLimit(rateKey, 60, 60);
  if (!rate.allowed) {
    return { success: false, errorMessage: "Too many admin requests. Please wait a minute." };
  }

  const parsed = uuidSchema.safeParse(orderId);
  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.errors[0]?.message };
  }

  const adminClient = createAdminClient();

  const { data: order, error } = await adminClient
    .from("orders")
    .select("id, order_code, user_id, status, total_inr, order_items(label)")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return { success: false, errorMessage: "Order record not found." };
  }

  if (order.status !== "paid") {
    return {
      success: false,
      errorMessage: "Access emails can only be sent for orders that are paid.",
    };
  }

  const [userRes, profileRes] = await Promise.all([
    adminClient.auth.admin.getUserById(order.user_id),
    adminClient
      .from("profiles")
      .select("display_name")
      .eq("id", order.user_id)
      .maybeSingle(),
  ]);

  const studentEmail = userRes.data?.user?.email;
  if (!studentEmail) {
    return { success: false, errorMessage: "Student email address not found." };
  }

  const studentDisplayName = profileRes.data?.display_name || "Student";
  const kitTitle = order.order_items?.[0]?.label || "Project Kit";
  const orderUrl = `${siteConfig.siteUrl}/account/orders/${order.id}`;

  try {
    await sendEmail(
      "payment_approved_student",
      studentEmail,
      {
        orderCode: order.order_code,
        studentDisplayName,
        kitTitle,
        amountInr: order.total_inr,
        orderUrl,
      },
      order.user_id
    );
  } catch {
    logger.warn("Resend access email failed", { orderId });
    return { success: false, errorMessage: "Failed to dispatch email. Please try again." };
  }

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "resend_access_email",
    entity: "orders",
    entityId: order.id,
    details: { order_code: order.order_code },
  });

  revalidatePath(`/admin/orders/${order.id}`);

  return { success: true };
}

/**
 * Resets a download grant's download count back to 0.
 * Writes an audit row.
 */
export async function resetDownloadCountAction(
  grantId: string
): Promise<OrderAdminActionResult> {
  const adminUser = await requireAdmin();

  const rateKey = `admin_action_${adminUser.user.id}`;
  const rate = await rateLimit(rateKey, 60, 60);
  if (!rate.allowed) {
    return { success: false, errorMessage: "Too many admin requests. Please wait a minute." };
  }

  const parsed = uuidSchema.safeParse(grantId);
  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.errors[0]?.message };
  }

  const adminClient = createAdminClient();

  const { data: grant, error: fetchErr } = await adminClient
    .from("download_grants")
    .select("id, order_id, download_count")
    .eq("id", grantId)
    .single();

  if (fetchErr || !grant) {
    return { success: false, errorMessage: "Download grant not found." };
  }

  const { error: updateErr } = await adminClient
    .from("download_grants")
    .update({ download_count: 0 })
    .eq("id", grantId);

  if (updateErr) {
    return { success: false, errorMessage: "Failed to reset download count." };
  }

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "reset_download_count",
    entity: "download_grants",
    entityId: grantId,
    details: {
      order_id: grant.order_id,
      previous_count: grant.download_count,
    },
  });

  revalidatePath(`/admin/orders/${grant.order_id}`);
  revalidatePath(`/account/orders/${grant.order_id}`);

  return { success: true };
}

/**
 * Revokes a download grant immediately.
 * Writes an audit row.
 */
export async function revokeGrantAction(
  grantId: string
): Promise<OrderAdminActionResult> {
  const adminUser = await requireAdmin();

  const rateKey = `admin_action_${adminUser.user.id}`;
  const rate = await rateLimit(rateKey, 60, 60);
  if (!rate.allowed) {
    return { success: false, errorMessage: "Too many admin requests. Please wait a minute." };
  }

  const parsed = uuidSchema.safeParse(grantId);
  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.errors[0]?.message };
  }

  const adminClient = createAdminClient();

  const { data: grant, error: fetchErr } = await adminClient
    .from("download_grants")
    .select("id, order_id, revoked_at")
    .eq("id", grantId)
    .single();

  if (fetchErr || !grant) {
    return { success: false, errorMessage: "Download grant not found." };
  }

  const now = new Date().toISOString();
  const { error: updateErr } = await adminClient
    .from("download_grants")
    .update({ revoked_at: now })
    .eq("id", grantId);

  if (updateErr) {
    return { success: false, errorMessage: "Failed to revoke download grant." };
  }

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "revoke_grant",
    entity: "download_grants",
    entityId: grantId,
    details: { order_id: grant.order_id },
  });

  revalidatePath(`/admin/orders/${grant.order_id}`);
  revalidatePath(`/account/orders/${grant.order_id}`);

  return { success: true };
}
