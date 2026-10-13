import "server-only";
import { createAdminClient } from "@/server/supabase/admin";

export interface AuditActionParams {
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}

/**
 * Records an immutable administrative audit row in public.audit_log.
 * Details must never include personal customer data (passwords, tokens, payment proof paths, phone numbers).
 */
export async function logAdminAction({
  actorId,
  action,
  entity,
  entityId,
  details,
}: AuditActionParams): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_log").insert({
      actor_id: actorId,
      action,
      entity,
      entity_id: entityId || null,
      details: details || null,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Failures in audit logging are suppressed from breaking user flow,
    // while strictly retaining no sensitive data.
  }
}
