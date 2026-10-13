import "server-only";
import crypto from "node:crypto";
import { createAdminClient } from "@/server/supabase/admin";
import { rateLimit } from "@/server/security/rate-limit";
import { AppError } from "@/server/errors";
import { logger } from "@/server/log";

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "vtuadda_default_salt_2026";
  return crypto.createHash("sha256").update(ip.trim() + salt).digest("hex");
}

export interface CustomRequestDownloadResult {
  signedUrl: string;
}

export async function consumeCustomRequestDownloadAndSignUrl(params: {
  requestId: string;
  fileId: string;
  userId: string;
  clientIp: string;
  isAdmin?: boolean;
}): Promise<CustomRequestDownloadResult> {
  const { requestId, fileId, userId, clientIp, isAdmin } = params;
  const adminClient = createAdminClient();

  // 1. Rate limits: 5/min and 30/hr per user
  const minLimitKey = `dl_min_${userId}`;
  const hrLimitKey = `dl_hr_${userId}`;

  const [minCheck, hrCheck] = await Promise.all([
    rateLimit(minLimitKey, 5, 60),
    rateLimit(hrLimitKey, 30, 3600),
  ]);

  if (!minCheck.allowed || !hrCheck.allowed) {
    throw new AppError(
      "Download rate limit reached. Please wait a minute before downloading again.",
      "RATE_LIMIT_EXCEEDED",
      429
    );
  }

  // 2. Fetch request and check ownership
  const { data: req, error: reqErr } = await adminClient
    .from("custom_requests")
    .select("id, user_id, status, assigned_builder_id")
    .eq("id", requestId)
    .single();

  if (reqErr || !req) {
    throw new AppError("Request not found", "NOT_FOUND", 404);
  }

  const isOwner = req.user_id === userId;
  const isAssignedBuilder = req.assigned_builder_id === userId;

  if (!isOwner && !isAssignedBuilder && !isAdmin) {
    throw new AppError("Access denied: you do not have permission to download this file", "FORBIDDEN", 403);
  }

  // 3. Fetch file record
  const { data: file, error: fileErr } = await adminClient
    .from("request_files")
    .select("id, request_id, storage_path, original_name, kind, is_final")
    .eq("id", fileId)
    .eq("request_id", requestId)
    .single();

  if (fileErr || !file) {
    throw new AppError("File not found or does not belong to this request", "NOT_FOUND", 404);
  }

  // 4. Check if final file is unlocked
  // Final deliverable files (is_final = true) can only be downloaded by students if status is 'completed'
  if (file.is_final && !isAdmin && !isAssignedBuilder) {
    if (req.status !== "completed") {
      throw new AppError(
        "Final deliverable files are locked until the balance order is paid and approved",
        "FORBIDDEN",
        403
      );
    }
  }

  // 5. Generate 60-second signed URL
  const { data: signedData, error: signErr } = await adminClient.storage
    .from("request-files")
    .createSignedUrl(file.storage_path, 60, {
      download: file.original_name,
    });

  if (signErr || !signedData?.signedUrl) {
    logger.error("Failed to generate signed download URL for request file", {
      fileId,
      error: signErr?.message,
    });
    throw new AppError("Failed to generate secure download link", "STORAGE_ERROR", 500);
  }

  // 6. Record download in audit log
  await adminClient.from("audit_log").insert({
    actor_id: userId,
    action: "download_request_file",
    entity: "request_files",
    entity_id: fileId,
    details: {
      requestId,
      originalName: file.original_name,
      isFinal: file.is_final,
      ipHash: hashIp(clientIp),
    },
    created_at: new Date().toISOString(),
  });

  return { signedUrl: signedData.signedUrl };
}
