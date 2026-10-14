"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth";
import { createClient } from "@/server/supabase/server";

const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(60, "Display name must be 60 characters or fewer"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null))
    .refine(
      (val) => val === null || /^\+[1-9]\d{1,14}$/.test(val),
      "Phone number must be in E.164 format (e.g. +919876543210)"
    ),
});

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const authUser = await requireUser("/account");

  const parse = profileSchema.safeParse({
    display_name: formData.get("display_name"),
    phone: formData.get("phone"),
  });

  if (!parse.success) {
    return {
      status: "error",
      message: parse.error.issues[0]?.message || "Validation failed",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parse.data.display_name,
      phone: parse.data.phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", authUser.user.id);

  if (error) {
    return {
      status: "error",
      message: "Could not update profile. Please try again.",
    };
  }

  revalidatePath("/account");
  return {
    status: "success",
    message: "Profile updated successfully.",
  };
}

export async function requestAccountDeletionAction(reason: string) {
  const authUser = await requireUser("/account");
  const email = authUser.user.email || "";

  const { createAdminClient } = await import("@/server/supabase/admin");
  const { sendEmail } = await import("@/server/email/send");
  const { siteConfig } = await import("../../../site.config");

  const adminClient = createAdminClient();
  const { data: ticket, error } = await adminClient
    .from("tickets")
    .insert({
      user_id: authUser.user.id,
      email,
      name: authUser.profile?.display_name || "Student",
      kind: "deletion_request",
      subject: "Account Deletion Request",
      body: `User ${authUser.user.id} requested account deletion.\nReason: ${reason || "No reason provided"}`,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !ticket) {
    return { success: false, errorMessage: "Failed to submit deletion request." };
  }

  // Send email to user and admin
  try {
    await sendEmail("ticket_received", email, {
      recipientName: authUser.profile?.display_name || "Student",
      ticketId: ticket.id,
      subject: "Account Deletion Request",
      messageSnippet: "Your account deletion request has been registered and will be processed within 30 days.",
    });

    if (siteConfig.supportEmail) {
      await sendEmail("ticket_admin", siteConfig.supportEmail, {
        ticketId: ticket.id,
        senderName: authUser.profile?.display_name || "Student",
        senderEmail: email,
        subject: "Account Deletion Request",
        messageSnippet: `User requested deletion: ${reason || "None specified"}`,
        ticketUrl: `${siteConfig.siteUrl || "http://localhost:3000"}/admin/tickets`,
      });
    }
  } catch {
    // Non-fatal
  }

  revalidatePath("/account");
  return { success: true };
}
