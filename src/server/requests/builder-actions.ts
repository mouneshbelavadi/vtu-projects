"use server";
import { z } from "zod";
import crypto from "node:crypto";
import { createAdminClient } from "@/server/supabase/admin";
import { requireBuilder } from "@/server/auth";
import { AppError } from "@/server/errors";
import { logger } from "@/server/log";
import { dispatchEmail } from "@/server/email/send";
import { generateOrderCode } from "@/server/orders/code";
import { transitionCustomRequest } from "@/server/requests/state-machine";
import { validateBuilderDeliverableFile } from "@/server/storage/file-signatures";
import { MILESTONE_STATUSES, type MilestoneStatus } from "@/types/database";
import { publicEnv } from "@/lib/public-env";

export async function updateMilestoneStatusAction(params: {
  requestId: string;
  milestoneId: string;
  status: MilestoneStatus;
}): Promise<{ success: boolean }> {
  // 1. Require builder role and AAL2 MFA
  const authUser = await requireBuilder(`/builder/requests/${params.requestId}`);
  const builderId = authUser.user.id;
  const adminClient = createAdminClient();

  // 2. Validate request assignment to this builder
  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select("id, title, user_id, status, assigned_builder_id")
    .eq("id", params.requestId)
    .single();

  if (reqErr || !req) {
    throw new AppError("Request not found", "NOT_FOUND", 404);
  }

  if (req.assigned_builder_id !== builderId) {
    throw new AppError("Access denied: request is not assigned to you", "FORBIDDEN", 403);
  }

  // 3. Validate milestone exists and belongs to request
  const { data: milestone, error: mErr } = await adminClient
    .from("milestones")
    .select("id, title, status, needs_student_input, student_input_text")
    .eq("id", params.milestoneId)
    .eq("request_id", params.requestId)
    .single();

  if (mErr || !milestone) {
    throw new AppError("Milestone not found", "NOT_FOUND", 404);
  }

  if (!MILESTONE_STATUSES.includes(params.status)) {
    throw new AppError("Invalid milestone status", "VALIDATION_ERROR", 400);
  }

  // 4. Update milestone status
  const { error: updateErr } = await adminClient
    .from("milestones")
    .update({ status: params.status })
    .eq("id", params.milestoneId);

  if (updateErr) {
    logger.error("Failed to update milestone status", { error: updateErr.message });
    throw new AppError("Failed to update milestone status", "DB_ERROR", 500);
  }

  // 5. If status is 'awaiting_student', send notification email
  if (params.status === "awaiting_student") {
    const { data: studentUser } = await adminClient.auth.admin.getUserById(req.user_id);
    const { data: studentProfile } = await adminClient
      .from("profiles")
      .select("display_name")
      .eq("id", req.user_id)
      .single();

    if (studentUser?.user?.email) {
      const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL;
      const requestUrl = `${siteUrl}/account/requests/${req.id}`;

      await dispatchEmail(
        "milestone_input_needed",
        studentUser.user.email,
        {
          studentDisplayName: studentProfile?.display_name || "Student",
          requestTitle: req.title,
          milestoneTitle: milestone.title,
          instructions: milestone.student_input_text || "Input required to continue milestone build",
          requestUrl,
        },
        req.user_id
      );
    }
  }

  // 6. Log audit
  await adminClient.from("audit_log").insert({
    actor_id: builderId,
    action: "update_milestone_status",
    entity: "milestones",
    entity_id: params.milestoneId,
    details: {
      requestId: params.requestId,
      newStatus: params.status,
    },
    created_at: new Date().toISOString(),
  });

  return { success: true };
}

export async function uploadDeliverableFileAction(params: {
  requestId: string;
  name: string;
  size: number;
  buffer: Buffer;
}): Promise<{ success: boolean; fileId: string }> {
  const authUser = await requireBuilder(`/builder/requests/${params.requestId}`);
  const builderId = authUser.user.id;
  const adminClient = createAdminClient();

  // 1. Verify request is assigned to builder and in active progress
  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select("id, status, assigned_builder_id")
    .eq("id", params.requestId)
    .single();

  if (reqErr || !req) {
    throw new AppError("Request not found", "NOT_FOUND", 404);
  }

  if (req.assigned_builder_id !== builderId) {
    throw new AppError("Access denied: request is not assigned to you", "FORBIDDEN", 403);
  }

  if (req.status !== "in_progress") {
    throw new AppError(
      `Cannot upload deliverables: request is in status "${req.status}"`,
      "INVALID_STATE",
      400
    );
  }

  // 2. Validate file signature and size
  const check = validateBuilderDeliverableFile(params.buffer, params.name);
  if (!check.valid) {
    throw new AppError(
      `File "${params.name}" was refused: ${check.error}`,
      "INVALID_FILE",
      400
    );
  }

  // 3. Upload to storage bucket 'request-files'
  const fileId = crypto.randomUUID();
  const ext = params.name.split(".").pop()?.toLowerCase() || "bin";
  const storagePath = `requests/${params.requestId}/deliv_${fileId}.${ext}`;

  const { error: uploadErr } = await adminClient.storage
    .from("request-files")
    .upload(storagePath, params.buffer, {
      contentType: check.contentType,
      upsert: false,
    });

  if (uploadErr) {
    logger.error("Failed to upload deliverable file", { error: uploadErr.message });
    throw new AppError("Failed to store file deliverable", "STORAGE_ERROR", 500);
  }

  // 4. Insert row into request_files
  const { error: fileErr } = await adminClient.from("request_files").insert({
    id: fileId,
    request_id: params.requestId,
    uploaded_by: builderId,
    kind: "deliverable",
    storage_path: storagePath,
    original_name: params.name,
    size_bytes: params.size,
    content_type: check.contentType,
    is_final: false,
  });

  if (fileErr) {
    logger.error("Failed to record deliverable file metadata", { error: fileErr.message });
    throw new AppError("Failed to save deliverable record", "DB_ERROR", 500);
  }

  return { success: true, fileId };
}

export async function markDeliveryAction(params: {
  requestId: string;
}): Promise<{ success: boolean; balanceOrderId: string }> {
  const authUser = await requireBuilder(`/builder/requests/${params.requestId}`);
  const builderId = authUser.user.id;
  const adminClient = createAdminClient();

  // 1. Verify assignment and in_progress status
  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select("id, title, user_id, status, assigned_builder_id, quote_total_inr, quote_deposit_inr, ack_integrity")
    .eq("id", params.requestId)
    .single();

  if (reqErr || !req) {
    throw new AppError("Request not found", "NOT_FOUND", 404);
  }

  if (req.assigned_builder_id !== builderId) {
    throw new AppError("Access denied: request is not assigned to you", "FORBIDDEN", 403);
  }

  if (req.status !== "in_progress") {
    throw new AppError(
      `Cannot mark delivery: request is in status "${req.status}"`,
      "INVALID_STATE",
      400
    );
  }

  // 2. Verify deliverable files exist
  const { data: deliverables, error: delivErr } = await adminClient
    .from("request_files")
    .select("id")
    .eq("request_id", params.requestId)
    .eq("kind", "deliverable");

  if (delivErr || !deliverables || deliverables.length === 0) {
    throw new AppError(
      "Cannot mark delivery before uploading deliverable files",
      "NO_DELIVERABLES",
      400
    );
  }

  // 3. Mark all deliverable files as is_final = true
  const { error: markFilesErr } = await adminClient
    .from("request_files")
    .update({ is_final: true })
    .eq("request_id", params.requestId)
    .eq("kind", "deliverable");

  if (markFilesErr) {
    logger.error("Failed to mark deliverables as final", { error: markFilesErr.message });
    throw new AppError("Failed to mark files as final", "DB_ERROR", 500);
  }

  // 4. Calculate balance amount
  const totalInr = req.quote_total_inr || 0;
  const depositInr = req.quote_deposit_inr || 0;
  const balanceInr = Math.max(0, totalInr - depositInr);

  // 5. Generate Balance Order
  let balanceOrderId: string;

  // Check if balance order already exists (idempotency)
  const { data: existingBalanceItem } = await adminClient
    .from("order_items")
    .select("order_id")
    .eq("request_id", req.id)
    .eq("label", "Balance")
    .maybeSingle();

  if (existingBalanceItem) {
    balanceOrderId = existingBalanceItem.order_id;
  } else {
    const orderCode = generateOrderCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: order, error: orderErr } = await adminClient
      .from("orders")
      .insert({
        order_code: orderCode,
        user_id: req.user_id,
        type: "custom",
        status: "awaiting_payment",
        subtotal_inr: balanceInr,
        discount_inr: 0,
        total_inr: balanceInr,
        ack_integrity: true,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      logger.error("Failed to create balance order", { error: orderErr?.message });
      throw new AppError("Failed to generate balance order", "DB_ERROR", 500);
    }

    const { error: itemErr } = await adminClient.from("order_items").insert({
      order_id: order.id,
      request_id: req.id,
      label: "Balance",
      price_inr: balanceInr,
    });

    if (itemErr) {
      logger.error("Failed to create balance order item", { error: itemErr.message });
      throw new AppError("Failed to attach balance item", "DB_ERROR", 500);
    }

    balanceOrderId = order.id;
  }

  // 6. Transition request status from 'in_progress' to 'delivered'
  await transitionCustomRequest({
    requestId: req.id,
    targetStatus: "delivered",
    actorId: builderId,
    reason: "Builder completed deliverables and marked delivery",
  });

  // 7. Dispatch final_files_ready email to student with balance amount
  const { data: studentUser } = await adminClient.auth.admin.getUserById(req.user_id);
  const { data: studentProfile } = await adminClient
    .from("profiles")
    .select("display_name")
    .eq("id", req.user_id)
    .single();

  if (studentUser?.user?.email) {
    const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL;
    const requestUrl = `${siteUrl}/account/requests/${req.id}`;

    await dispatchEmail(
      "final_files_ready",
      studentUser.user.email,
      {
        studentDisplayName: studentProfile?.display_name || "Student",
        requestTitle: req.title,
        balanceAmountInr: balanceInr,
        requestUrl,
      },
      req.user_id
    );
  }

  return { success: true, balanceOrderId };
}
