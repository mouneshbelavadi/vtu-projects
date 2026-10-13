import "server-only";
import { createAdminClient } from "@/server/supabase/admin";
import { AppError } from "@/server/errors";
import { logger } from "@/server/log";
import type { CustomRequestStatus } from "@/types/database";

export const ALLOWED_STATUS_TRANSITIONS: Record<CustomRequestStatus, CustomRequestStatus[]> = {
  submitted: ["under_review", "declined", "cancelled"],
  under_review: ["quoted", "declined", "cancelled"],
  quoted: ["accepted", "declined", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["delivered", "cancelled"],
  delivered: ["completed", "cancelled"],
  completed: [],
  declined: [],
  cancelled: [],
};

export function isAllowedTransition(
  fromStatus: CustomRequestStatus,
  toStatus: CustomRequestStatus
): boolean {
  const targets = ALLOWED_STATUS_TRANSITIONS[fromStatus];
  return targets ? targets.includes(toStatus) : false;
}

export async function transitionCustomRequest(params: {
  requestId: string;
  targetStatus: CustomRequestStatus;
  actorId: string;
  reason?: string;
}): Promise<{ ok: boolean; status: CustomRequestStatus }> {
  const { requestId, targetStatus, actorId, reason } = params;
  const adminClient = createAdminClient();

  // 1. Fetch current status
  const { data: req, error: fetchErr } = await adminClient
    .from("custom_requests")
    .select("id, status")
    .eq("id", requestId)
    .single();

  if (fetchErr || !req) {
    throw new AppError("Custom request not found", "NOT_FOUND", 404);
  }

  const currentStatus = req.status as CustomRequestStatus;
  if (currentStatus === targetStatus) {
    return { ok: true, status: currentStatus };
  }

  if (!isAllowedTransition(currentStatus, targetStatus)) {
    throw new AppError(
      `Forbidden status transition: cannot move request from ${currentStatus} to ${targetStatus}`,
      "INVALID_STATUS_TRANSITION",
      400
    );
  }

  // 2. Invoke atomic SQL function transition_custom_request
  const { error: rpcErr } = await adminClient.rpc("transition_custom_request", {
    p_request_id: requestId,
    p_target_status: targetStatus,
    p_actor_id: actorId,
    p_reason: reason || null,
  });

  if (rpcErr) {
    logger.error("transition_custom_request SQL function error", {
      requestId,
      targetStatus,
      error: rpcErr.message,
    });
    throw new AppError(rpcErr.message, "STATE_TRANSITION_FAILED", 400);
  }

  return { ok: true, status: targetStatus };
}
