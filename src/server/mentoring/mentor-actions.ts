"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireBuilder } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { logAdminAction } from "@/server/audit";

export interface MentorActionResult {
  success: boolean;
  errorMessage?: string;
}

const meetUrlSchema = z
  .string()
  .trim()
  .regex(/^https:\/\/[^\s]+$/, "Meeting link must start with https://");

/**
 * Updates the meeting link for a session owned by the authenticated mentor.
 * Enforces builder role + AAL2 MFA, checks session ownership, validates HTTPS URL,
 * and never fetches the URL.
 */
export async function updateMentorMeetingLinkAction(
  bookingId: string,
  meetUrl: string
): Promise<MentorActionResult> {
  const builderUser = await requireBuilder("/builder/sessions");

  const parsed = meetUrlSchema.safeParse(meetUrl);
  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.issues[0]?.message };
  }

  const adminClient = createAdminClient();

  // Verify ownership: booking must correspond to a slot where mentor_id is the builder
  const { data: booking, error: fetchErr } = await adminClient
    .from("bookings")
    .select(`
      id,
      slot_id,
      mentor_slots!inner ( mentor_id )
    `)
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) {
    return { success: false, errorMessage: "Session booking not found." };
  }

  const slot = (booking as unknown as { mentor_slots: { mentor_id: string } }).mentor_slots;
  if (slot.mentor_id !== builderUser.user.id) {
    return { success: false, errorMessage: "You are not authorized to update this session." };
  }

  const { error: updateErr } = await adminClient
    .from("bookings")
    .update({ meet_url: parsed.data })
    .eq("id", bookingId);

  if (updateErr) {
    return { success: false, errorMessage: updateErr.message };
  }

  await logAdminAction({
    actorId: builderUser.user.id,
    action: "mentor_update_meet_url",
    entity: "bookings",
    entityId: bookingId,
    details: { meet_url: parsed.data },
  });

  revalidatePath("/builder/sessions");
  return { success: true };
}
