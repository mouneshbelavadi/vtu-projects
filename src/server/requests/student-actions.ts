"use server";
import { z } from "zod";
import { createAdminClient } from "@/server/supabase/admin";
import { requireUser } from "@/server/auth";
import { rateLimit } from "@/server/security/rate-limit";
import { AppError } from "@/server/errors";
import { logger } from "@/server/log";
import { dispatchEmail } from "@/server/email/send";
import { generateOrderCode } from "@/server/orders/code";
import { transitionCustomRequest } from "@/server/requests/state-machine";
import { publicEnv } from "@/lib/public-env";

export async function acceptQuoteAction(params: {
  requestId: string;
  ackIntegrity: boolean;
}): Promise<{ orderId: string; redirectUrl: string }> {
  const authUser = await requireUser(`/account/requests/${params.requestId}`);
  const userId = authUser.user.id;

  if (params.ackIntegrity !== true) {
    throw new AppError(
      "You must accept the scope, price, and milestone participation terms",
      "VALIDATION_ERROR",
      400
    );
  }

  const adminClient = createAdminClient();

  // 1. Load request strictly scoped to user
  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select(
      "id, title, user_id, status, quote_total_inr, quote_deposit_inr, quote_valid_until, ack_integrity"
    )
    .eq("id", params.requestId)
    .eq("user_id", userId)
    .single();

  if (reqErr || !req) {
    throw new AppError("Request not found or access denied", "NOT_FOUND", 404);
  }

  // 2. Check status and quote validity
  if (req.status !== "quoted") {
    // If already accepted, return existing deposit order if present (idempotent)
    if (req.status === "accepted" || req.status === "in_progress") {
      const { data: existingItem } = await adminClient
        .from("order_items")
        .select("order_id")
        .eq("request_id", req.id)
        .eq("label", "Deposit")
        .maybeSingle();

      if (existingItem) {
        return {
          orderId: existingItem.order_id,
          redirectUrl: `/checkout/${existingItem.order_id}`,
        };
      }
    }
    throw new AppError(
      `Cannot accept quote: request is in status "${req.status}"`,
      "INVALID_STATE",
      400
    );
  }

  if (!req.quote_deposit_inr || req.quote_deposit_inr < 1) {
    throw new AppError("Quote deposit amount has not been configured", "INVALID_QUOTE", 400);
  }

  if (req.quote_valid_until) {
    const validUntilDate = new Date(req.quote_valid_until);
    // End of that valid-until day in UTC/local
    validUntilDate.setHours(23, 59, 59, 999);
    if (new Date() > validUntilDate) {
      throw new AppError(
        "This quote has expired. Please contact support to request an updated quote.",
        "QUOTE_EXPIRED",
        400
      );
    }
  }

  // 3. Check for existing order for idempotency
  const { data: existingItem } = await adminClient
    .from("order_items")
    .select("order_id")
    .eq("request_id", req.id)
    .eq("label", "Deposit")
    .maybeSingle();

  if (existingItem) {
    return {
      orderId: existingItem.order_id,
      redirectUrl: `/checkout/${existingItem.order_id}`,
    };
  }

  // 4. Create Custom Order for Deposit
  const orderCode = generateOrderCode();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: order, error: orderErr } = await adminClient
    .from("orders")
    .insert({
      order_code: orderCode,
      user_id: userId,
      type: "custom",
      status: "awaiting_payment",
      subtotal_inr: req.quote_deposit_inr,
      discount_inr: 0,
      total_inr: req.quote_deposit_inr,
      ack_integrity: true,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    logger.error("Failed to create deposit order for custom request", {
      requestId: req.id,
      error: orderErr?.message,
    });
    throw new AppError("Failed to initiate checkout order", "DB_ERROR", 500);
  }

  // 5. Create Order Item labelled 'Deposit'
  const { error: itemErr } = await adminClient.from("order_items").insert({
    order_id: order.id,
    request_id: req.id,
    label: "Deposit",
    price_inr: req.quote_deposit_inr,
  });

  if (itemErr) {
    logger.error("Failed to insert deposit order item", { error: itemErr.message });
    throw new AppError("Failed to attach order item", "DB_ERROR", 500);
  }

  // 6. Transition request status to 'accepted'
  await transitionCustomRequest({
    requestId: req.id,
    targetStatus: "accepted",
    actorId: userId,
    reason: "Student accepted quote",
  });

  return {
    orderId: order.id,
    redirectUrl: `/checkout/${order.id}`,
  };
}

export async function declineQuoteAction(params: {
  requestId: string;
  reason?: string;
}): Promise<{ success: boolean }> {
  const authUser = await requireUser();
  const userId = authUser.user.id;
  const adminClient = createAdminClient();

  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select("id, status")
    .eq("id", params.requestId)
    .eq("user_id", userId)
    .single();

  if (reqErr || !req) {
    throw new AppError("Request not found", "NOT_FOUND", 404);
  }

  if (req.status !== "quoted") {
    throw new AppError("Cannot decline quote: request is not in quoted status", "INVALID_STATE", 400);
  }

  await transitionCustomRequest({
    requestId: params.requestId,
    targetStatus: "declined",
    actorId: userId,
    reason: params.reason?.trim() || "Student declined quote",
  });

  return { success: true };
}

export async function saveMilestoneInputAction(params: {
  requestId: string;
  milestoneId: string;
  inputText: string;
}): Promise<{ success: boolean }> {
  const authUser = await requireUser();
  const userId = authUser.user.id;
  const adminClient = createAdminClient();

  // Validate input text
  const trimmed = params.inputText.trim();
  if (!trimmed || trimmed.length < 1 || trimmed.length > 2000) {
    throw new AppError(
      "Milestone input text must be between 1 and 2000 characters",
      "VALIDATION_ERROR",
      400
    );
  }

  // Check request ownership
  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select("id, status")
    .eq("id", params.requestId)
    .eq("user_id", userId)
    .single();

  if (reqErr || !req) {
    throw new AppError("Request not found or access denied", "NOT_FOUND", 404);
  }

  // Check milestone belongs to request
  const { data: milestone, error: mErr } = await adminClient
    .from("milestones")
    .select("id, status, needs_student_input")
    .eq("id", params.milestoneId)
    .eq("request_id", params.requestId)
    .single();

  if (mErr || !milestone) {
    throw new AppError("Milestone not found", "NOT_FOUND", 404);
  }

  // Update milestone student_input_text
  const updatePayload: { student_input_text: string; status?: "in_progress" } = {
    student_input_text: trimmed,
  };
  if (milestone.status === "awaiting_student") {
    updatePayload.status = "in_progress";
  }

  const { error: updateErr } = await adminClient
    .from("milestones")
    .update(updatePayload)
    .eq("id", params.milestoneId);

  if (updateErr) {
    logger.error("Failed to save milestone input", { error: updateErr.message });
    throw new AppError("Failed to save milestone input", "DB_ERROR", 500);
  }

  // Write audit log
  await adminClient.from("audit_log").insert({
    actor_id: userId,
    action: "submit_milestone_input",
    entity: "milestones",
    entity_id: params.milestoneId,
    details: { requestId: params.requestId },
    created_at: new Date().toISOString(),
  });

  return { success: true };
}

export async function sendMessageAction(params: {
  requestId: string;
  body: string;
}): Promise<{ success: boolean; messageId: string }> {
  const authUser = await requireUser();
  const userId = authUser.user.id;
  const userRoles = authUser.roles;

  // 1. Rate limit: 20 messages per hour per user
  const rateLimitKey = `msg_user_${userId}`;
  const rateCheck = await rateLimit(rateLimitKey, 20, 3600);
  if (!rateCheck.allowed) {
    throw new AppError(
      "Message rate limit reached (maximum 20 messages per hour). Please try again later.",
      "RATE_LIMIT_EXCEEDED",
      429
    );
  }

  // 2. Validate message body: plain text, 1 to 4000 chars
  const trimmed = params.body.trim();
  if (!trimmed || trimmed.length < 1 || trimmed.length > 4000) {
    throw new AppError(
      "Message must be between 1 and 4000 characters",
      "VALIDATION_ERROR",
      400
    );
  }

  const adminClient = createAdminClient();

  // 3. Verify user has permission to post to this request
  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select("id, title, user_id, assigned_builder_id")
    .eq("id", params.requestId)
    .single();

  if (reqErr || !req) {
    throw new AppError("Request not found", "NOT_FOUND", 404);
  }

  const isOwner = req.user_id === userId;
  const isBuilder = req.assigned_builder_id === userId && userRoles.includes("builder");
  const isAdmin = userRoles.includes("admin");

  if (!isOwner && !isBuilder && !isAdmin) {
    throw new AppError("Access denied: you cannot message on this request", "FORBIDDEN", 403);
  }

  // 4. Insert message
  const { data: msg, error: msgErr } = await adminClient
    .from("messages")
    .insert({
      request_id: params.requestId,
      sender_id: userId,
      body: trimmed,
    })
    .select("id")
    .single();

  if (msgErr || !msg) {
    logger.error("Failed to insert message", { error: msgErr?.message });
    throw new AppError("Failed to send message", "DB_ERROR", 500);
  }

  // 5. Throttled email notification: at most once every 30 minutes per request thread
  const emailThrottleKey = `msg_notify_${params.requestId}`;
  const emailThrottle = await rateLimit(emailThrottleKey, 1, 1800);

  if (emailThrottle.allowed) {
    // Determine recipient
    let recipientUserId: string | null = null;
    let senderName = "Project collaborator";

    if (isOwner) {
      // Sender is student -> notify builder or admin
      recipientUserId = req.assigned_builder_id;
      const { data: studentProfile } = await adminClient
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      senderName = studentProfile?.display_name || "Student";
    } else {
      // Sender is builder or admin -> notify student
      recipientUserId = req.user_id;
      if (isAdmin) {
        senderName = "VTU Adda Support";
      } else {
        const { data: bProfile } = await adminClient
          .from("profiles")
          .select("display_name")
          .eq("id", userId)
          .single();
        senderName = bProfile?.display_name?.split(" ")[0] || "Builder";
      }
    }

    if (recipientUserId) {
      const { data: recipientUser } = await adminClient.auth.admin.getUserById(recipientUserId);
      const { data: recipientProfile } = await adminClient
        .from("profiles")
        .select("display_name")
        .eq("id", recipientUserId)
        .single();

      if (recipientUser?.user?.email) {
        const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL;
        const threadUrl = isOwner
          ? `${siteUrl}/builder/requests/${req.id}`
          : `${siteUrl}/account/requests/${req.id}`;

        const snippet = trimmed.length > 200 ? trimmed.slice(0, 197) + "..." : trimmed;

        await dispatchEmail(
          "new_message",
          recipientUser.user.email,
          {
            recipientDisplayName: recipientProfile?.display_name || "User",
            senderName,
            requestTitle: req.title,
            messageSnippet: snippet,
            requestUrl: threadUrl,
          },
          recipientUserId
        );
      }
    }
  }

  return { success: true, messageId: msg.id };
}
