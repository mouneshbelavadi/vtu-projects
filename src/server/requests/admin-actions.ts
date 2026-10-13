"use server";
import { z } from "zod";
import { createAdminClient } from "@/server/supabase/admin";
import { requireAdmin } from "@/server/auth";
import { AppError } from "@/server/errors";
import { logger } from "@/server/log";
import { dispatchEmail } from "@/server/email/send";
import { transitionCustomRequest } from "@/server/requests/state-machine";
import { formatDate } from "@/lib/format";

const sendQuoteSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  scope: z
    .string()
    .trim()
    .min(10, "Scope description must be at least 10 characters")
    .max(5000, "Scope description cannot exceed 5000 characters"),
  totalPriceInr: z
    .number()
    .int("Total price must be an integer")
    .min(1, "Total price must be at least ₹1"),
  depositAmountInr: z
    .number()
    .int("Deposit amount must be an integer")
    .min(1, "Deposit amount must be at least ₹1"),
  validUntil: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime());
  }, "Valid until date is required"),
  expectedDeliveryDate: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime());
  }, "Expected delivery date is required"),
  assignedBuilderId: z.string().uuid("Assigned builder ID must be a valid UUID"),
  milestones: z
    .array(
      z.object({
        title: z
          .string()
          .trim()
          .min(3, "Milestone title must be at least 3 characters")
          .max(200, "Milestone title cannot exceed 200 characters"),
        description: z.string().trim().max(1000).optional().nullable(),
        dueDate: z.string().optional().nullable(),
        needsStudentInput: z.boolean(),
        instructions: z.string().trim().max(1000).optional().nullable(),
      })
    )
    .min(2, "A project quote must contain at least 2 milestones")
    .max(8, "A project quote cannot contain more than 8 milestones"),
}).refine((data) => data.depositAmountInr <= data.totalPriceInr, {
  message: "Deposit amount cannot exceed total price",
  path: ["depositAmountInr"],
});

export async function openRequestForReviewAction(requestId: string): Promise<boolean> {
  const admin = await requireAdmin();
  const adminClient = createAdminClient();

  const { data: req } = await adminClient
    .from("custom_requests")
    .select("status")
    .eq("id", requestId)
    .single();

  if (req && req.status === "submitted") {
    await transitionCustomRequest({
      requestId,
      targetStatus: "under_review",
      actorId: admin.user.id,
      reason: "Admin opened request for review",
    });
    return true;
  }
  return false;
}

export async function sendQuoteAction(input: z.infer<typeof sendQuoteSchema>): Promise<{ success: boolean }> {
  const admin = await requireAdmin();
  const adminClient = createAdminClient();

  // 1. Validate quote inputs
  const parsed = sendQuoteSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.errors.map((e) => e.message).join(", ");
    throw new AppError(errorMsg, "VALIDATION_ERROR", 400);
  }

  const {
    requestId,
    scope,
    totalPriceInr,
    depositAmountInr,
    validUntil,
    expectedDeliveryDate,
    assignedBuilderId,
    milestones,
  } = parsed.data;

  // 2. Verify assigned builder has 'builder' role
  const { data: roleRow, error: roleErr } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", assignedBuilderId)
    .eq("role", "builder")
    .maybeSingle();

  if (roleErr || !roleRow) {
    throw new AppError("The assigned user does not have the builder role", "INVALID_BUILDER", 400);
  }

  // 3. Load request and student info
  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select("id, title, user_id, status")
    .eq("id", requestId)
    .single();

  if (reqErr || !req) {
    throw new AppError("Custom request not found", "NOT_FOUND", 404);
  }

  if (req.status !== "under_review" && req.status !== "submitted") {
    throw new AppError(
      `Cannot send quote: request is currently in status "${req.status}"`,
      "INVALID_STATE",
      400
    );
  }

  // 4. Update request quote fields
  const { error: updateErr } = await adminClient
    .from("custom_requests")
    .update({
      quote_total_inr: totalPriceInr,
      quote_deposit_inr: depositAmountInr,
      quote_note: scope,
      quote_valid_until: validUntil,
      deadline: expectedDeliveryDate,
      assigned_builder_id: assignedBuilderId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateErr) {
    logger.error("Failed to update custom request quote details", { error: updateErr.message });
    throw new AppError("Failed to save quote details", "DB_ERROR", 500);
  }

  // 5. Replace milestones
  await adminClient.from("milestones").delete().eq("request_id", requestId);

  const milestoneInserts = milestones.map((m, idx) => ({
    request_id: requestId,
    position: idx + 1,
    title: m.title,
    description: m.description || null,
    due_date: m.dueDate || null,
    needs_student_input: m.needsStudentInput,
    student_input_text: m.instructions || null, // Instructions given to student initially
    status: "pending" as const,
  }));

  const { error: milestoneErr } = await adminClient
    .from("milestones")
    .insert(milestoneInserts);

  if (milestoneErr) {
    logger.error("Failed to insert quote milestones", { error: milestoneErr.message });
    throw new AppError("Failed to save milestones", "DB_ERROR", 500);
  }

  // 6. Transition status to 'quoted'
  // If still in 'submitted', advance to 'under_review' first if needed, then to 'quoted'
  if (req.status === "submitted") {
    await transitionCustomRequest({
      requestId,
      targetStatus: "under_review",
      actorId: admin.user.id,
      reason: "Admin reviewing quote",
    });
  }

  await transitionCustomRequest({
    requestId,
    targetStatus: "quoted",
    actorId: admin.user.id,
    reason: "Quote sent by admin",
  });

  // 7. Dispatch quote_sent email to student
  const { data: studentUser } = await adminClient.auth.admin.getUserById(req.user_id);
  const { data: studentProfile } = await adminClient
    .from("profiles")
    .select("display_name")
    .eq("id", req.user_id)
    .single();

  if (studentUser?.user?.email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const requestUrl = `${siteUrl}/account/requests/${requestId}`;

    await dispatchEmail(
      "quote_sent",
      studentUser.user.email,
      {
        studentDisplayName: studentProfile?.display_name || "Student",
        requestTitle: req.title,
        totalPriceInr,
        depositAmountInr,
        validUntilText: formatDate(validUntil),
        requestUrl,
      },
      req.user_id
    );
  }

  return { success: true };
}

export async function declineRequestAction(params: {
  requestId: string;
  reason: string;
}): Promise<{ success: boolean }> {
  const admin = await requireAdmin();
  const adminClient = createAdminClient();

  const trimmedReason = params.reason.trim();
  if (!trimmedReason || trimmedReason.length < 5 || trimmedReason.length > 500) {
    throw new AppError(
      "A decline reason between 5 and 500 characters is required",
      "VALIDATION_ERROR",
      400
    );
  }

  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select("id, title, user_id, status")
    .eq("id", params.requestId)
    .single();

  if (reqErr || !req) {
    throw new AppError("Custom request not found", "NOT_FOUND", 404);
  }

  await transitionCustomRequest({
    requestId: params.requestId,
    targetStatus: "declined",
    actorId: admin.user.id,
    reason: trimmedReason,
  });

  // Dispatch email to student
  const { data: studentUser } = await adminClient.auth.admin.getUserById(req.user_id);
  const { data: studentProfile } = await adminClient
    .from("profiles")
    .select("display_name")
    .eq("id", req.user_id)
    .single();

  if (studentUser?.user?.email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const requestUrl = `${siteUrl}/account/requests/${req.id}`;

    await dispatchEmail(
      "request_declined",
      studentUser.user.email,
      {
        studentDisplayName: studentProfile?.display_name || "Student",
        requestTitle: req.title,
        reason: trimmedReason,
        requestUrl,
      },
      req.user_id
    );
  }

  return { success: true };
}

export async function cancelRequestAdminAction(params: {
  requestId: string;
  note: string;
}): Promise<{ success: boolean }> {
  const admin = await requireAdmin();
  const adminClient = createAdminClient();

  const trimmedNote = params.note.trim();
  if (!trimmedNote || trimmedNote.length < 5 || trimmedNote.length > 500) {
    throw new AppError(
      "A cancellation note between 5 and 500 characters is required",
      "VALIDATION_ERROR",
      400
    );
  }

  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select("id, title, user_id, status")
    .eq("id", params.requestId)
    .single();

  if (reqErr || !req) {
    throw new AppError("Custom request not found", "NOT_FOUND", 404);
  }

  await transitionCustomRequest({
    requestId: params.requestId,
    targetStatus: "cancelled",
    actorId: admin.user.id,
    reason: trimmedNote,
  });

  return { success: true };
}
