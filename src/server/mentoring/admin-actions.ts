"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { rateLimit } from "@/server/security/rate-limit";
import { logAdminAction } from "@/server/audit";
import { sendEmail } from "@/server/email";
import { formatISTDateTime } from "@/lib/format";

export interface AdminMentoringResult {
  success: boolean;
  errorMessage?: string;
}

const tierSchema = z.object({
  name: z.string().trim().min(1, "Tier name is required").max(80, "Tier name must be 80 characters or fewer"),
  description: z.string().trim().max(500, "Description must be 500 characters or fewer").optional().nullable(),
  price_inr: z.coerce.number().int().min(0, "Price must be non-negative"),
  session_minutes: z.coerce.number().int().min(15, "Session length must be at least 15 minutes").max(120, "Session length cannot exceed 120 minutes"),
  active: z.boolean().default(true),
});

export async function createTierAction(formData: FormData): Promise<AdminMentoringResult> {
  const adminUser = await requireAdmin();
  const rate = await rateLimit(`admin_tier_${adminUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, errorMessage: "Rate limit reached. Please wait a moment." };
  }

  const rawActive = formData.get("active");
  const parsed = tierSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    price_inr: formData.get("price_inr"),
    session_minutes: formData.get("session_minutes"),
    active: rawActive === "true" || rawActive === "on",
  });

  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.issues[0]?.message };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("mentoring_tiers")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      price_inr: parsed.data.price_inr,
      session_minutes: parsed.data.session_minutes,
      session_count: 1,
      active: parsed.data.active,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, errorMessage: error?.message || "Could not create tier." };
  }

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "create_mentoring_tier",
    entity: "mentoring_tiers",
    entityId: data.id,
    details: parsed.data,
  });

  revalidatePath("/admin/mentoring");
  revalidatePath("/mentoring");
  return { success: true };
}

export async function updateTierAction(tierId: string, formData: FormData): Promise<AdminMentoringResult> {
  const adminUser = await requireAdmin();
  const rate = await rateLimit(`admin_tier_${adminUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, errorMessage: "Rate limit reached. Please wait a moment." };
  }

  const rawActive = formData.get("active");
  const parsed = tierSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    price_inr: formData.get("price_inr"),
    session_minutes: formData.get("session_minutes"),
    active: rawActive === "true" || rawActive === "on",
  });

  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.issues[0]?.message };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("mentoring_tiers")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      price_inr: parsed.data.price_inr,
      session_minutes: parsed.data.session_minutes,
      session_count: 1,
      active: parsed.data.active,
    })
    .eq("id", tierId);

  if (error) {
    return { success: false, errorMessage: error.message };
  }

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "update_mentoring_tier",
    entity: "mentoring_tiers",
    entityId: tierId,
    details: parsed.data,
  });

  revalidatePath("/admin/mentoring");
  revalidatePath("/mentoring");
  return { success: true };
}

export async function toggleTierActiveAction(tierId: string, active: boolean): Promise<AdminMentoringResult> {
  const adminUser = await requireAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("mentoring_tiers")
    .update({ active })
    .eq("id", tierId);

  if (error) {
    return { success: false, errorMessage: error.message };
  }

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "toggle_tier_active",
    entity: "mentoring_tiers",
    entityId: tierId,
    details: { active },
  });

  revalidatePath("/admin/mentoring");
  revalidatePath("/mentoring");
  return { success: true };
}

export async function reorderTiersAction(tierIds: string[]): Promise<AdminMentoringResult> {
  const adminUser = await requireAdmin();
  const adminClient = createAdminClient();

  for (let i = 0; i < tierIds.length; i++) {
    await adminClient
      .from("mentoring_tiers")
      .update({ sort_order: i })
      .eq("id", tierIds[i]);
  }

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "reorder_mentoring_tiers",
    entity: "mentoring_tiers",
    details: { count: tierIds.length },
  });

  revalidatePath("/admin/mentoring");
  revalidatePath("/mentoring");
  return { success: true };
}

// Slots management

const generateSlotsSchema = z.object({
  mentorId: z.string().uuid("Please select a valid mentor"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid start time (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid end time (HH:MM)"),
  slotMinutes: z.enum(["30", "45", "60"]).transform(Number),
});

export async function generateSlotsAction(formData: FormData): Promise<AdminMentoringResult> {
  const adminUser = await requireAdmin();
  const rate = await rateLimit(`admin_slot_${adminUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, errorMessage: "Rate limit reached. Please wait a moment." };
  }

  const parsed = generateSlotsSchema.safeParse({
    mentorId: formData.get("mentorId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    slotMinutes: formData.get("slotMinutes"),
  });

  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.issues[0]?.message };
  }

  const { mentorId, date, startTime, endTime, slotMinutes } = parsed.data;
  const adminClient = createAdminClient();

  // Verify mentor exists and holds builder role
  const { data: roleCheck } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", mentorId)
    .eq("role", "builder")
    .maybeSingle();

  if (!roleCheck) {
    return { success: false, errorMessage: "Selected user does not have the builder role." };
  }

  // Parse IST start and end times into Date objects
  const startIso = `${date}T${startTime}:00+05:30`;
  const endIso = `${date}T${endTime}:00+05:30`;
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();

  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
    return { success: false, errorMessage: "End time must be later than start time." };
  }

  const slotIntervalMs = slotMinutes * 60 * 1000;
  const slotsToInsert: { mentor_id: string; starts_at: string; ends_at: string; status: "open" }[] = [];

  let currentStartMs = startMs;
  while (currentStartMs + slotIntervalMs <= endMs) {
    const currentEndMs = currentStartMs + slotIntervalMs;
    slotsToInsert.push({
      mentor_id: mentorId,
      starts_at: new Date(currentStartMs).toISOString(),
      ends_at: new Date(currentEndMs).toISOString(),
      status: "open",
    });
    currentStartMs = currentEndMs;
  }

  if (slotsToInsert.length === 0) {
    return {
      success: false,
      errorMessage: "Time range is shorter than the selected slot duration.",
    };
  }

  // Insert slots sequentially or in batch to detect overlap
  const { error } = await adminClient.from("mentor_slots").insert(slotsToInsert);

  if (error) {
    // Code 23P01 is PostgreSQL exclusion_violation
    if (error.code === "23P01" || error.message.toLowerCase().includes("exclude") || error.message.toLowerCase().includes("overlap")) {
      return {
        success: false,
        errorMessage: "This slot overlaps with an existing slot for this mentor.",
      };
    }
    return { success: false, errorMessage: error.message || "Failed to create slots." };
  }

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "generate_mentor_slots",
    entity: "mentor_slots",
    details: { mentorId, date, slotCount: slotsToInsert.length, slotMinutes },
  });

  revalidatePath("/admin/mentoring");
  return { success: true };
}

export async function deleteSlotAction(slotId: string): Promise<AdminMentoringResult> {
  const adminUser = await requireAdmin();
  const adminClient = createAdminClient();

  // Only open slots can be deleted
  const { data: slot } = await adminClient
    .from("mentor_slots")
    .select("id, status")
    .eq("id", slotId)
    .single();

  if (!slot) {
    return { success: false, errorMessage: "Slot not found." };
  }

  if (slot.status !== "open") {
    return { success: false, errorMessage: "Only open slots can be deleted." };
  }

  const { error } = await adminClient.from("mentor_slots").delete().eq("id", slotId);
  if (error) {
    return { success: false, errorMessage: error.message };
  }

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "delete_mentor_slot",
    entity: "mentor_slots",
    entityId: slotId,
  });

  revalidatePath("/admin/mentoring");
  return { success: true };
}

// Bookings management

const meetUrlSchema = z.string().trim().regex(/^https:\/\/[^\s]+$/, "Meeting link must start with https://");

export async function updateBookingMeetingLinkAction(bookingId: string, meetUrl: string): Promise<AdminMentoringResult> {
  const adminUser = await requireAdmin();
  const parsed = meetUrlSchema.safeParse(meetUrl);
  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.issues[0]?.message };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("bookings")
    .update({ meet_url: parsed.data })
    .eq("id", bookingId);

  if (error) {
    return { success: false, errorMessage: error.message };
  }

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "update_booking_meet_url",
    entity: "bookings",
    entityId: bookingId,
    details: { meet_url: parsed.data },
  });

  revalidatePath("/admin/mentoring");
  revalidatePath(`/account/bookings`);
  return { success: true };
}

export async function markBookingCompletedAction(bookingId: string): Promise<AdminMentoringResult> {
  const adminUser = await requireAdmin();
  const adminClient = createAdminClient();

  const { data: booking } = await adminClient
    .from("bookings")
    .select("id, status")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return { success: false, errorMessage: "Booking not found." };
  }

  if (booking.status !== "confirmed") {
    return { success: false, errorMessage: "Only confirmed bookings can be marked completed." };
  }

  const { error } = await adminClient
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", bookingId);

  if (error) {
    return { success: false, errorMessage: error.message };
  }

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "complete_booking",
    entity: "bookings",
    entityId: bookingId,
  });

  revalidatePath("/admin/mentoring");
  revalidatePath(`/account/bookings`);
  return { success: true };
}

export async function cancelBookingAdminAction(bookingId: string, reason: string): Promise<AdminMentoringResult> {
  const adminUser = await requireAdmin();
  const cleanReason = reason.trim();
  if (!cleanReason) {
    return { success: false, errorMessage: "A cancellation reason is required." };
  }

  const adminClient = createAdminClient();
  const { data: booking, error: fetchErr } = await adminClient
    .from("bookings")
    .select(`
      id,
      user_id,
      slot_id,
      status,
      mentoring_tiers ( name ),
      mentor_slots ( starts_at )
    `)
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) {
    return { success: false, errorMessage: "Booking not found." };
  }

  if (booking.status === "cancelled" || booking.status === "refunded") {
    return { success: false, errorMessage: "Booking is already cancelled or refunded." };
  }

  // Update booking status
  const { error: cancelErr } = await adminClient
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_reason: cleanReason,
    })
    .eq("id", bookingId);

  if (cancelErr) {
    return { success: false, errorMessage: cancelErr.message };
  }

  // Free the slot
  if (booking.slot_id) {
    await adminClient
      .from("mentor_slots")
      .update({
        status: "open",
        held_until: null,
        held_by: null,
      })
      .eq("id", booking.slot_id);
  }

  // Email student notification
  try {
    const [userRes, profileRes] = await Promise.all([
      adminClient.auth.admin.getUserById(booking.user_id),
      adminClient.from("profiles").select("display_name").eq("id", booking.user_id).maybeSingle(),
    ]);

    const studentEmail = userRes.data?.user?.email;
    const studentDisplayName = profileRes.data?.display_name || "Student";
    const tierName = (booking.mentoring_tiers as unknown as { name?: string })?.name || "Mentoring Session";
    const slot = (booking as unknown as { mentor_slots?: { starts_at?: string } }).mentor_slots;
    const sessionTimeIst = slot?.starts_at ? formatISTDateTime(slot.starts_at) : "IST";

    if (studentEmail) {
      await sendEmail("booking_cancelled", studentEmail, {
        studentDisplayName,
        tierName,
        sessionTimeIst,
        reason: cleanReason,
      });
    }
  } catch {
    // email failure logged by sendEmail
  }

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "cancel_booking",
    entity: "bookings",
    entityId: bookingId,
    details: { reason: cleanReason },
  });

  revalidatePath("/admin/mentoring");
  revalidatePath(`/account/bookings`);
  return { success: true };
}
