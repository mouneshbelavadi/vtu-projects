"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { rateLimit } from "@/server/security/rate-limit";
import { sendEmail } from "@/server/email";
import { siteConfig } from "../../../site.config";

export interface StudentActionResult {
  success: boolean;
  errorMessage?: string;
}

const cancelRequestSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID"),
  reason: z.string().trim().min(5, "Please explain why you need to cancel (at least 5 characters)").max(1000, "Reason must be 1000 characters or fewer"),
});

/**
 * Creates a support ticket for an admin to process booking cancellation & refund.
 */
export async function requestBookingCancellationAction(
  bookingId: string,
  reason: string
): Promise<StudentActionResult> {
  const authUser = await requireUser("/account/bookings");

  const rate = await rateLimit(`cancel_ticket_${authUser.user.id}`, 5, 3600);
  if (!rate.allowed) {
    return {
      success: false,
      errorMessage: "Request limit reached. Please wait before submitting another cancellation request.",
    };
  }

  const parsed = cancelRequestSchema.safeParse({ bookingId, reason });
  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.issues[0]?.message };
  }

  const adminClient = createAdminClient();

  // Verify ownership and booking status
  const { data: booking, error: fetchErr } = await adminClient
    .from("bookings")
    .select("id, user_id, status")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking || booking.user_id !== authUser.user.id) {
    return { success: false, errorMessage: "Booking not found." };
  }

  if (booking.status === "cancelled" || booking.status === "refunded") {
    return { success: false, errorMessage: "This booking has already been cancelled or refunded." };
  }

  const userEmail = authUser.user.email || "student@vtuadda.com";

  // Create support ticket
  const { error: ticketErr } = await adminClient.from("tickets").insert({
    user_id: authUser.user.id,
    email: userEmail,
    kind: "support",
    subject: `Cancel booking ${bookingId}`,
    body: `Student requested cancellation for booking ${bookingId}.\n\nReason: ${parsed.data.reason}`,
    status: "open",
  });

  if (ticketErr) {
    return { success: false, errorMessage: "Failed to submit cancellation request. Please try again." };
  }

  // Notify admin via email
  try {
    if (siteConfig.supportEmail) {
      await sendEmail(
        "new_message",
        siteConfig.supportEmail,
        {
          recipientDisplayName: "Admin",
          senderName: "Student",
          requestTitle: `Cancel booking ${bookingId}`,
          messageSnippet: parsed.data.reason,
          requestUrl: `${siteConfig.siteUrl}/admin/mentoring`,
        }
      );
    }
  } catch {
    // Non-fatal
  }

  revalidatePath("/account/bookings");
  return { success: true };
}
