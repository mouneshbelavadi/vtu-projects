import "server-only";
import { createAdminClient } from "@/server/supabase/admin";

export interface SystemSettings {
  upi_payee_name: string;
  upi_vpa: string;
  order_expiry_hours: number;
  max_downloads_default: number;
  proof_retention_days: number | null;
  verification_time_text: string | null;
  mentoring_min_notice_hours: number;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const adminClient = createAdminClient();

  const { data: rows } = await adminClient
    .from("site_settings")
    .select("key, value");

  const settingsMap: Record<string, unknown> = {};
  if (rows) {
    for (const row of rows) {
      settingsMap[row.key] = row.value;
    }
  }

  return {
    upi_payee_name: typeof settingsMap.upi_payee_name === "string" ? settingsMap.upi_payee_name : "",
    upi_vpa: typeof settingsMap.upi_vpa === "string" ? settingsMap.upi_vpa : "",
    order_expiry_hours:
      typeof settingsMap.order_expiry_hours === "number" ? settingsMap.order_expiry_hours : 24,
    max_downloads_default:
      typeof settingsMap.max_downloads_default === "number" ? settingsMap.max_downloads_default : 5,
    proof_retention_days:
      typeof settingsMap.proof_retention_days === "number" ? settingsMap.proof_retention_days : null,
    verification_time_text:
      typeof settingsMap.verification_time_text === "string"
        ? settingsMap.verification_time_text
        : null,
    mentoring_min_notice_hours:
      typeof settingsMap.mentoring_min_notice_hours === "number"
        ? settingsMap.mentoring_min_notice_hours
        : 12,
  };
}
