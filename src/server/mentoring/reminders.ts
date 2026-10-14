import "server-only";
import { createAdminClient } from "@/server/supabase/admin";
import { sendEmail } from "@/server/email";
import { siteConfig } from "../../../site.config";
import { formatISTDateTime } from "@/lib/format";
import { logger } from "@/server/log";

export interface SessionReminderResult {
  reminders_sent: number;
}

/**
 * Hourly cron worker that dispatches session reminders to students and mentors
 * for confirmed sessions starting in 23 to 25 hours that have not yet received one.
 * Each reminder is sent exactly once, guarded by atomic reminder_sent_at timestamps.
 */
export async function sendSessionReminders(): Promise<SessionReminderResult> {
  const adminClient = createAdminClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  // Find eligible confirmed bookings
  const { data: bookings, error } = await adminClient
    .from("bookings")
    .select(`
      id,
      user_id,
      meet_url,
      reminder_sent_at,
      mentoring_tiers ( name ),
      mentor_slots!inner (
        id,
        mentor_id,
        starts_at
      )
    `)
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("mentor_slots.starts_at", windowStart)
    .lte("mentor_slots.starts_at", windowEnd);

  if (error || !bookings || bookings.length === 0) {
    return { reminders_sent: 0 };
  }

  let sentCount = 0;

  for (const b of bookings) {
    const executedAt = new Date().toISOString();

    // Atomic claim to guarantee each reminder is sent exactly once
    const { data: updatedBooking, error: updateErr } = await adminClient
      .from("bookings")
      .update({ reminder_sent_at: executedAt })
      .eq("id", b.id)
      .is("reminder_sent_at", null)
      .select("id")
      .maybeSingle();

    if (updateErr || !updatedBooking) {
      continue;
    }

    sentCount++;

    const tierName =
      (b.mentoring_tiers as unknown as { name?: string })?.name || "Mentoring Session";
    const slot = (b as unknown as { mentor_slots: { mentor_id: string; starts_at: string } }).mentor_slots;
    const sessionTimeIst = slot?.starts_at ? formatISTDateTime(slot.starts_at) : "IST";
    const meetUrl = b.meet_url;

    // 1. Send reminder to student
    try {
      const [studentUser, studentProfile] = await Promise.all([
        adminClient.auth.admin.getUserById(b.user_id),
        adminClient.from("profiles").select("display_name").eq("id", b.user_id).maybeSingle(),
      ]);

      const studentEmail = studentUser.data?.user?.email;
      const studentName = studentProfile.data?.display_name || "Student";
      const studentDashboardUrl = `${siteConfig.siteUrl}/account/bookings`;

      if (studentEmail) {
        await sendEmail("session_reminder", studentEmail, {
          recipientDisplayName: studentName,
          tierName,
          sessionTimeIst,
          meetUrl,
          role: "student",
          sessionUrl: studentDashboardUrl,
        });
      }
    } catch {
      logger.warn("Failed to dispatch student reminder", { bookingId: b.id });
    }

    // 2. Send reminder to mentor
    try {
      if (slot?.mentor_id) {
        const [mentorUser, mentorProfile] = await Promise.all([
          adminClient.auth.admin.getUserById(slot.mentor_id),
          adminClient.from("profiles").select("display_name").eq("id", slot.mentor_id).maybeSingle(),
        ]);

        const mentorEmail = mentorUser.data?.user?.email;
        const mentorName = mentorProfile.data?.display_name || "Mentor";
        const mentorDashboardUrl = `${siteConfig.siteUrl}/builder/sessions`;

        if (mentorEmail) {
          await sendEmail("session_reminder", mentorEmail, {
            recipientDisplayName: mentorName,
            tierName,
            sessionTimeIst,
            meetUrl,
            role: "mentor",
            sessionUrl: mentorDashboardUrl,
          });
        }
      }
    } catch {
      logger.warn("Failed to dispatch mentor reminder", { bookingId: b.id });
    }
  }

  return { reminders_sent: sentCount };
}
