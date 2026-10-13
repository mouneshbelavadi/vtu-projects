import "server-only";
import crypto from "node:crypto";
import { env } from "@/server/env";
import { createAdminClient } from "@/server/supabase/admin";
import { logAdminAction } from "@/server/audit";
import { logger } from "@/server/log";

/**
 * Validates the cron authorization header against CRON_SECRET using constant-time comparison.
 */
export function verifyCronAuthorization(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || env.CRON_SECRET;
  if (!authHeader || !cronSecret) {
    return false;
  }

  const expectedHeader = `Bearer ${cronSecret}`;
  const authBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expectedHeader);

  if (authBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(authBuffer, expectedBuffer);
}

export interface PurgeResult {
  purged_count: number;
  skipped_reason?: string;
}

/**
 * Purges expired screenshot proofs from storage.
 * Strictly respects proof_retention_days in site_settings.
 * Payments still pending verification are NEVER purged.
 * Never deletes or modifies the payment row's UTR, amount, status, or order.
 */
export async function purgeExpiredProofs(): Promise<PurgeResult> {
  const adminClient = createAdminClient();

  // Read proof_retention_days from site_settings
  const { data: settingRow } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "proof_retention_days")
    .maybeSingle();

  const retentionVal = settingRow?.value;
  let retentionDays: number | null = null;

  if (typeof retentionVal === "number") {
    retentionDays = retentionVal;
  } else if (typeof retentionVal === "string" && /^[0-9]+$/.test(retentionVal)) {
    retentionDays = parseInt(retentionVal, 10);
  }

  if (retentionDays === null || retentionDays <= 0) {
    return {
      purged_count: 0,
      skipped_reason: "proof_retention_days not set or invalid",
    };
  }

  // Attempt RPC first, falling back to query if running with direct table permissions
  let expiredProofs: Array<{ id: string; proof_path: string }> = [];

  const { data: rpcData, error: rpcError } = await adminClient.rpc(
    "purge_expired_proofs",
    { p_batch_size: 50 }
  );

  if (!rpcError && Array.isArray(rpcData)) {
    expiredProofs = rpcData.map((row) => ({
      id: row.payment_id || row.id,
      proof_path: row.proof_path,
    }));
  } else {
    // Direct query fallback
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const { data: queryData } = await adminClient
      .from("payments")
      .select("id, proof_path")
      .not("proof_path", "is", null)
      .is("proof_deleted_at", null)
      .neq("status", "pending_verification")
      .not("verified_at", "is", null)
      .lte("verified_at", cutoffDate)
      .limit(50);

    if (queryData) {
      expiredProofs = queryData.map((p) => ({
        id: p.id,
        proof_path: p.proof_path as string,
      }));
    }
  }

  if (expiredProofs.length === 0) {
    return { purged_count: 0 };
  }

  let purgedCount = 0;

  for (const item of expiredProofs) {
    if (!item.proof_path) continue;

    // Delete file from payment-proofs bucket
    const { error: deleteError } = await adminClient.storage
      .from("payment-proofs")
      .remove([item.proof_path]);

    if (deleteError) {
      // Never log proof_path! Leave the row so next run retries it.
      logger.warn("Failed to delete proof screenshot from storage bucket", {
        paymentId: item.id,
      });
      continue;
    }

    // Only after physical file is deleted, update payment row
    const { error: updateError } = await adminClient
      .from("payments")
      .update({
        proof_path: null,
        proof_deleted_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (updateError) {
      logger.warn("Failed to update payment proof_deleted_at timestamp", {
        paymentId: item.id,
      });
      continue;
    }

    purgedCount++;
  }

  // Write ONE audit log row with count only (never logging paths or UTRs)
  if (purgedCount > 0) {
    await logAdminAction({
      actorId: null,
      action: "purge_payment_proofs",
      entity: "payments",
      details: { purged_count: purgedCount },
    });
  }

  return { purged_count: purgedCount };
}
