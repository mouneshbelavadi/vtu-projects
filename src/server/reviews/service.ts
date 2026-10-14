import "server-only";

import { createAdminClient } from "@/server/supabase/admin";
import { logger } from "@/server/log";
import type { Review, ReviewStatus } from "@/types/database";

export interface SubmitReviewInput {
  userId: string;
  orderId: string;
  projectId: string;
  rating: number;
  body: string;
}

export interface SubmitReviewResult {
  success: boolean;
  reviewId?: string;
  errorMessage?: string;
}

/**
 * Submits a verified buyer review with the following strict invariants:
 * 1. Order must be paid and belong to the requesting user.
 * 2. Order must contain the specified project.
 * 3. Student must have downloaded at least one deliverable file from the kit.
 * 4. User can submit only one review per project (unique constraint enforced).
 * 5. Review is always inserted as 'pending' and invisible to the public.
 */
export async function submitVerifiedReview(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  const { userId, orderId, projectId, rating, body } = input;
  const adminClient = createAdminClient();

  // 1. Validate rating
  const cleanRating = Math.floor(rating);
  if (cleanRating < 1 || cleanRating > 5) {
    return { success: false, errorMessage: "Rating must be between 1 and 5 stars." };
  }

  // 2. Validate body length (20 to 2000 chars)
  const cleanBody = (body || "").trim();
  if (cleanBody.length < 20) {
    return { success: false, errorMessage: "Review text must be at least 20 characters long." };
  }
  if (cleanBody.length > 2000) {
    return { success: false, errorMessage: "Review text cannot exceed 2000 characters." };
  }

  // 3. Verify order ownership, status, and project presence
  const { data: order, error: orderErr } = await adminClient
    .from("orders")
    .select("id, user_id, status")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return { success: false, errorMessage: "Order not found." };
  }

  if (order.user_id !== userId) {
    return { success: false, errorMessage: "You do not own this order." };
  }

  if (order.status !== "paid") {
    return { success: false, errorMessage: "You can only review kits from paid orders." };
  }

  // 4. Verify project is in order
  const { data: orderItem, error: itemErr } = await adminClient
    .from("order_items")
    .select("id")
    .eq("order_id", orderId)
    .eq("project_id", projectId)
    .single();

  if (itemErr || !orderItem) {
    return { success: false, errorMessage: "The specified kit is not part of this order." };
  }

  // 5. Verify student has downloaded at least one file
  const { data: grants, error: grantErr } = await adminClient
    .from("download_grants")
    .select("id, download_count")
    .eq("order_id", orderId)
    .eq("project_id", projectId);

  if (grantErr || !grants || grants.length === 0) {
    return { success: false, errorMessage: "No download grants found for this kit." };
  }

  const hasDownloaded = grants.some((g) => (g.download_count || 0) > 0);
  if (!hasDownloaded) {
    return {
      success: false,
      errorMessage: "You must download at least one file before reviewing this project.",
    };
  }

  // 6. Check for duplicate review
  const { data: existingReview } = await adminClient
    .from("reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (existingReview) {
    return { success: false, errorMessage: "You have already submitted a review for this kit." };
  }

  // 7. Insert review as pending
  const { data: inserted, error: insertErr } = await adminClient
    .from("reviews")
    .insert({
      user_id: userId,
      project_id: projectId,
      order_id: orderId,
      rating: cleanRating,
      body: cleanBody,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    logger.error("Failed to insert review", { error: insertErr, userId, projectId });
    return { success: false, errorMessage: "Failed to submit review. Please try again." };
  }

  return { success: true, reviewId: inserted.id };
}

/**
 * Moderates a review: approves or hides it. Admin cannot edit the text.
 */
export async function moderateReview(params: {
  reviewId: string;
  status: "approved" | "hidden";
  adminReason?: string | null;
  adminUserId: string;
}): Promise<{ success: boolean; errorMessage?: string }> {
  const { reviewId, status, adminReason, adminUserId } = params;
  const adminClient = createAdminClient();

  const { data: current, error: fetchErr } = await adminClient
    .from("reviews")
    .select("id, status, project_id")
    .eq("id", reviewId)
    .single();

  if (fetchErr || !current) {
    return { success: false, errorMessage: "Review not found." };
  }

  const now = new Date().toISOString();
  const { error: updateErr } = await adminClient
    .from("reviews")
    .update({
      status,
      admin_reason: adminReason || null,
      reviewed_by: adminUserId,
      reviewed_at: now,
    })
    .eq("id", reviewId);

  if (updateErr) {
    return { success: false, errorMessage: "Failed to update review moderation." };
  }

  // Audit log
  await adminClient.from("audit_log").insert({
    actor_id: adminUserId,
    action: status === "approved" ? "review_approved" : "review_hidden",
    entity: "review",
    entity_id: reviewId,
    details: {
      old_status: current.status,
      new_status: status,
      admin_reason: adminReason,
      project_id: current.project_id,
    },
  });

  return { success: true };
}
