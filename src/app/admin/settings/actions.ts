"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { createClient as createServerClient } from "@/server/supabase/server";
import { rateLimit } from "@/server/security/rate-limit";
import { logAdminAction } from "@/server/audit";
import { sendSecurityEmail } from "@/server/email";
import { siteConfig } from "../../../../site.config";

const generalSettingsSchema = z.object({
  order_expiry_hours: z.coerce.number().int().min(1).max(72),
  max_downloads_default: z.coerce.number().int().min(1).max(20),
  proof_retention_days: z.coerce
    .number()
    .int()
    .min(1)
    .max(365)
    .nullable()
    .optional(),
  verification_time_text: z
    .string()
    .trim()
    .max(120, "Verification time text must be at most 120 characters")
    .nullable()
    .optional(),
  mentoring_min_notice_hours: z.coerce.number().int().min(1).max(168).default(12),
});

const upiSettingsSchema = z.object({
  upi_payee_name: z.string().trim().min(2, "Payee name must be at least 2 characters").max(100),
  upi_vpa: z
    .string()
    .trim()
    .regex(
      /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/,
      "UPI VPA format must be username@handle (letters, digits, dot, hyphen or underscore)"
    ),
  totp_code: z.string().trim().length(6, "Enter the 6-digit code from your authenticator app"),
});

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function updateGeneralSettings(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const authUser = await requireAdmin();

  // Rate limit: 60 actions per minute per admin
  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return {
      status: "error",
      message: "Rate limit exceeded. Please wait a minute before making another change.",
    };
  }

  const parse = generalSettingsSchema.safeParse({
    order_expiry_hours: formData.get("order_expiry_hours"),
    max_downloads_default: formData.get("max_downloads_default"),
    proof_retention_days: formData.get("proof_retention_days") || null,
    verification_time_text: formData.get("verification_time_text") || null,
  });

  if (!parse.success) {
    return {
      status: "error",
      message: parse.error.issues[0]?.message || "Invalid settings input",
    };
  }

  const adminClient = createAdminClient();
  const {
    order_expiry_hours,
    max_downloads_default,
    proof_retention_days,
    verification_time_text,
    mentoring_min_notice_hours,
  } = parse.data;

  const now = new Date().toISOString();
  const upserts = [
    {
      key: "order_expiry_hours",
      value: order_expiry_hours,
      updated_by: authUser.user.id,
      updated_at: now,
    },
    {
      key: "max_downloads_default",
      value: max_downloads_default,
      updated_by: authUser.user.id,
      updated_at: now,
    },
    {
      key: "verification_time_text",
      value: verification_time_text || "",
      updated_by: authUser.user.id,
      updated_at: now,
    },
    {
      key: "mentoring_min_notice_hours",
      value: mentoring_min_notice_hours,
      updated_by: authUser.user.id,
      updated_at: now,
    },
  ];

  if (proof_retention_days !== null && proof_retention_days !== undefined) {
    upserts.push({
      key: "proof_retention_days",
      value: proof_retention_days,
      updated_by: authUser.user.id,
      updated_at: now,
    });
  }

  const { error } = await adminClient.from("site_settings").upsert(upserts);

  if (error) {
    return {
      status: "error",
      message: "Could not save operational settings. Try again.",
    };
  }

  await logAdminAction({
    actorId: authUser.user.id,
    action: "update_operational_settings",
    entity: "site_settings",
    details: {
      order_expiry_hours,
      max_downloads_default,
      proof_retention_days,
      verification_time_text: verification_time_text || "",
      mentoring_min_notice_hours,
    },
  });

  revalidatePath("/admin/settings");
  return {
    status: "success",
    message: "Operational settings updated successfully.",
  };
}

export async function updateUpiSettings(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const authUser = await requireAdmin();

  // Rate limit: 60 actions per minute per admin
  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return {
      status: "error",
      message: "Rate limit exceeded. Please wait a minute before making another change.",
    };
  }

  const parse = upiSettingsSchema.safeParse({
    upi_payee_name: formData.get("upi_payee_name"),
    upi_vpa: formData.get("upi_vpa"),
    totp_code: formData.get("totp_code"),
  });

  if (!parse.success) {
    return {
      status: "error",
      message: parse.error.issues[0]?.message || "Validation failed for UPI settings",
    };
  }

  const { upi_payee_name, upi_vpa, totp_code } = parse.data;

  // Verify TOTP challenge through Supabase Auth
  const serverClient = await createServerClient();
  const { data: factors, error: factorsError } =
    await serverClient.auth.mfa.listFactors();

  if (factorsError || !factors?.totp?.length) {
    return {
      status: "error",
      message: "Could not retrieve multi-factor authenticator. Re-enrol TOTP at /admin/mfa.",
    };
  }

  const verifiedFactor = factors.totp.find((f) => f.status === "verified");
  if (!verifiedFactor) {
    return {
      status: "error",
      message: "No verified authenticator factor found for this account.",
    };
  }

  const { error: verifyError } = await serverClient.auth.mfa.challengeAndVerify({
    factorId: verifiedFactor.id,
    code: totp_code,
  });

  if (verifyError) {
    return {
      status: "error",
      message: "Invalid two-factor authentication code. Verification failed.",
    };
  }

  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { error: saveError } = await adminClient.from("site_settings").upsert([
    {
      key: "upi_payee_name",
      value: upi_payee_name,
      updated_by: authUser.user.id,
      updated_at: now,
    },
    {
      key: "upi_vpa",
      value: upi_vpa,
      updated_by: authUser.user.id,
      updated_at: now,
    },
  ]);

  if (saveError) {
    return {
      status: "error",
      message: "Failed to persist UPI settings. Please try again.",
    };
  }

  // Record audit row (no secrets)
  await logAdminAction({
    actorId: authUser.user.id,
    action: "update_upi_settings",
    entity: "site_settings",
    details: {
      actor_email: authUser.user.email,
      timestamp: now,
    },
  });

  // Notify support email and all admins
  try {
    const { data: adminUsers } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminEmails: string[] = [siteConfig.supportEmail];
    if (adminUsers) {
      for (const row of adminUsers) {
        const { data: userData } = await adminClient.auth.admin.getUserById(row.user_id);
        if (userData?.user?.email && !adminEmails.includes(userData.user.email)) {
          adminEmails.push(userData.user.email);
        }
      }
    }

    await sendSecurityEmail({
      to: adminEmails,
      subject: "[Security Notice] UPI Payment Details Modified",
      text: `Security Notification:\n\nThe UPI payee name and UPI ID were updated in VTU Adda Projects by ${authUser.user.email} at ${now}.\n\nIf you did not make this change, please inspect the administrator audit logs immediately.`,
    });
  } catch {
    // Non-fatal if email provider is mocked in development
  }

  revalidatePath("/admin/settings");
  return {
    status: "success",
    message: "UPI payment settings updated and security notice dispatched.",
  };
}
