import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import {
  AdminMentoringClient,
  type MentorOption,
  type AdminBookingItem,
} from "./admin-mentoring-client";

export const metadata: Metadata = {
  title: "Mentoring Sessions Management | Admin | VTU Adda",
  description: "Manage mentoring tiers, slots, and student bookings.",
};

export default async function AdminMentoringPage() {
  await requireAdmin();
  const adminClient = createAdminClient();

  // 1. Fetch all mentoring tiers
  const { data: tiersData } = await adminClient
    .from("mentoring_tiers")
    .select("id, name, description, price_inr, session_count, session_minutes, active, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  // 2. Fetch mentors (users with builder role)
  const { data: builderRoles } = await adminClient
    .from("user_roles")
    .select("user_id")
    .eq("role", "builder");

  const builderIds = builderRoles?.map((r) => r.user_id) || [];

  const { data: mentorProfiles } = builderIds.length > 0
    ? await adminClient
        .from("profiles")
        .select("id, display_name")
        .in("id", builderIds)
    : { data: [] };

  const mentorsMap = new Map<string, string>();
  const mentorOptions: MentorOption[] = [];

  for (const p of mentorProfiles || []) {
    mentorsMap.set(p.id, p.display_name || "Mentor");
    mentorOptions.push({
      id: p.id,
      displayName: p.display_name || "Mentor",
    });
  }

  // 3. Fetch all slots
  const { data: slotsData } = await adminClient
    .from("mentor_slots")
    .select("id, mentor_id, starts_at, ends_at, status, held_until, held_by, created_at")
    .order("starts_at", { ascending: false })
    .limit(100);

  const formattedSlots = (slotsData || []).map((s) => ({
    ...s,
    mentorName: mentorsMap.get(s.mentor_id) || "Mentor",
  }));

  // 4. Fetch all bookings
  const { data: bookingsData } = await adminClient
    .from("bookings")
    .select(`
      id,
      user_id,
      status,
      meet_url,
      cancelled_reason,
      created_at,
      mentoring_tiers ( name ),
      mentor_slots ( starts_at, ends_at )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  // Student IDs to load first names
  const studentIds = Array.from(new Set((bookingsData || []).map((b) => b.user_id)));
  const { data: studentProfiles } = studentIds.length > 0
    ? await adminClient
        .from("profiles")
        .select("id, display_name")
        .in("id", studentIds)
    : { data: [] };

  const studentNameMap = new Map<string, string>();
  for (const sp of studentProfiles || []) {
    const raw = sp.display_name || "Student";
    const firstName = raw.trim().split(/\s+/)[0] || "Student";
    studentNameMap.set(sp.id, firstName);
  }

  const formattedBookings: AdminBookingItem[] = (bookingsData || []).map((b) => {
    const tier = b.mentoring_tiers as unknown as { name?: string } | null;
    const slot = b.mentor_slots as unknown as { starts_at?: string; ends_at?: string } | null;

    return {
      id: b.id,
      status: b.status,
      meet_url: b.meet_url,
      cancelled_reason: b.cancelled_reason,
      studentFirstName: studentNameMap.get(b.user_id) || "Student",
      tierName: tier?.name || "Mentoring Session",
      slotStartTime: slot?.starts_at || "",
      slotEndTime: slot?.ends_at || "",
    };
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-rule pb-4">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Mentoring Sessions
        </h1>
        <p className="mt-1 text-sm text-ink-2">
          Manage one-to-one mentorship packages, time slots, and student bookings.
        </p>
      </div>

      <AdminMentoringClient
        initialTiers={tiersData || []}
        initialSlots={formattedSlots}
        initialBookings={formattedBookings}
        mentors={mentorOptions}
      />
    </div>
  );
}
