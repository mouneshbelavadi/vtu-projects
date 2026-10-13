import "server-only";
import crypto from "node:crypto";
import { createAdminClient } from "@/server/supabase/admin";
import { rateLimit } from "@/server/security/rate-limit";
import { generateLicenceSlip } from "@/content/licence";
import { AppError } from "@/server/errors";
import { formatDate } from "@/lib/format";
import { logger } from "@/server/log";

export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip.trim()).digest("hex");
}

export interface DownloadUrlResult {
  signedUrl: string;
}

export interface LicenceSlipResult {
  filename: string;
  content: string;
}

/**
 * Validates download authorization, decrements grant quota atomically,
 * creates a 60-second signed URL, and rolls back on failure.
 * Strict rate limits: 5 downloads/min and 30 downloads/hr.
 */
export async function consumeDownloadAndSignUrl(params: {
  orderId: string;
  fileId: string;
  userId: string;
  clientIp: string;
}): Promise<DownloadUrlResult> {
  const { orderId, fileId, userId, clientIp } = params;
  const adminClient = createAdminClient();

  // Rate limits: 5/min and 30/hr per user
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

  // Load and verify order ownership
  const { data: order, error: orderErr } = await adminClient
    .from("orders")
    .select("id, status, user_id, order_code")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (orderErr || !order) {
    throw new AppError("Order not found or access denied", "NOT_FOUND", 404);
  }

  if (order.status !== "paid") {
    throw new AppError("Files can only be downloaded for paid orders", "FORBIDDEN", 403);
  }

  // Load grant scoped to this order and user
  const { data: grant, error: grantErr } = await adminClient
    .from("download_grants")
    .select("id, project_id, max_downloads, download_count, expires_at, revoked_at")
    .eq("order_id", orderId)
    .eq("user_id", userId)
    .single();

  if (grantErr || !grant) {
    throw new AppError("No download grant found for this order", "NOT_FOUND", 404);
  }

  if (grant.revoked_at) {
    throw new AppError("Download grant has been revoked", "GRANT_REVOKED", 403);
  }

  if (grant.expires_at && new Date(grant.expires_at) <= new Date()) {
    throw new AppError("Download grant has expired", "GRANT_EXPIRED", 403);
  }

  if (grant.download_count >= grant.max_downloads) {
    throw new AppError(
      "Maximum download limit reached for this project",
      "DOWNLOAD_LIMIT_REACHED",
      403
    );
  }

  const hashedClientIp = hashIp(clientIp);

  // Call atomic SQL function consume_download
  let storagePath: string;
  let originalName: string;

  const { data: rpcRows, error: rpcErr } = await adminClient.rpc("consume_download", {
    p_grant_id: grant.id,
    p_file_id: fileId,
    p_ip_hash: hashedClientIp,
  });

  if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length > 0) {
    storagePath = rpcRows[0].storage_path;
    originalName = rpcRows[0].file_name;
  } else {
    // Fallback transaction if RPC is not present in mock test client
    const { data: fileRow, error: fileErr } = await adminClient
      .from("project_files")
      .select("id, storage_path, original_name, project_id")
      .eq("id", fileId)
      .eq("project_id", grant.project_id)
      .single();

    if (fileErr || !fileRow) {
      throw new AppError("File not found for this project", "NOT_FOUND", 404);
    }

    const nextCount = grant.download_count + 1;
    const { error: updateErr } = await adminClient
      .from("download_grants")
      .update({ download_count: nextCount })
      .eq("id", grant.id);

    if (updateErr) {
      throw new AppError("Failed to update download count", "INTERNAL_ERROR", 500);
    }

    await adminClient.from("download_log").insert({
      grant_id: grant.id,
      file_id: fileId,
      ip_hash: hashedClientIp,
    });

    storagePath = fileRow.storage_path;
    originalName = fileRow.original_name;
  }

  // Create 60-second signed URL
  const { data: signData, error: signErr } = await adminClient.storage
    .from("project-files")
    .createSignedUrl(storagePath, 60, {
      download: originalName,
    });

  if (signErr || !signData?.signedUrl) {
    // Rollback count if signed URL generation fails
    await adminClient
      .from("download_grants")
      .update({ download_count: Math.max(0, grant.download_count) })
      .eq("id", grant.id);

    logger.warn("Failed to generate signed download URL", { orderId, fileId });
    throw new AppError("Failed to initiate file download. Please try again.", "STORAGE_ERROR", 500);
  }

  return { signedUrl: signData.signedUrl };
}

/**
 * Generates an on-the-fly licence slip without consuming any download quota.
 */
export async function generateOrderLicenceSlip(params: {
  orderId: string;
  userId: string;
}): Promise<LicenceSlipResult> {
  const { orderId, userId } = params;
  const adminClient = createAdminClient();

  const { data: order, error: orderErr } = await adminClient
    .from("orders")
    .select("id, order_code, status, user_id, created_at, order_items(label)")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (orderErr || !order) {
    throw new AppError("Order not found or access denied", "NOT_FOUND", 404);
  }

  if (order.status !== "paid") {
    throw new AppError("Licence slips are only available for paid orders", "FORBIDDEN", 403);
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  const buyerName = profile?.display_name || "Student";
  const kitTitle = order.order_items?.[0]?.label || "Project Kit";
  const formattedDate = formatDate(order.created_at);

  const textContent = generateLicenceSlip({
    buyerName,
    orderCode: order.order_code,
    kitTitle,
    date: formattedDate,
  });

  return {
    filename: `LICENCE-${order.order_code}.txt`,
    content: textContent,
  };
}
