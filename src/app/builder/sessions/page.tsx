import type { Metadata } from "next";
import { requireBuilder } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { BuilderSessionsClient, type MentorSessionItem } from "./builder-sessions-client";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Mentoring Sessions | Builder Portal | VTU Adda",
  description: "View and manage your scheduled student mentoring sessions.",
};

export default async function BuilderSessionsPage() {
  const builderUser = await requireBuilder("/builder/sessions");
  const adminClient = createAdminClient();

  // Load all bookings associated with slots owned by this builder
  const { data: bookingsData } = await adminClient
    .from("bookings")
    .select(`
      id,
      user_id,
      status,
      meet_url,
      created_at,
      mentoring_tiers ( name ),
      mentor_slots!inner (
        id,
        mentor_id,
        starts_at,
        ends_at
      )
    `)
    .eq("mentor_slots.mentor_id", builderUser.user.id)
    .order("created_at", { ascending: false });

  const rawBookings = bookingsData || [];

  // Data Minimization: Load ONLY display_name from profiles and extract first name ONLY
  const studentIds = Array.from(new Set(rawBookings.map((b) => b.user_id)));
  const { data: profiles } = studentIds.length > 0
    ? await adminClient
        .from("profiles")
        .select("id, display_name")
        .in("id", studentIds)
    : { data: [] };

  const firstNameMap = new Map<string, string>();
  for (const p of profiles || []) {
    const rawName = p.display_name || "Student";
    const firstName = rawName.trim().split(/\s+/)[0] || "Student";
    firstNameMap.set(p.id, firstName);
  }

  const nowMs = Date.now();
  const sessions: MentorSessionItem[] = rawBookings.map((b) => {
    const tier = b.mentoring_tiers as unknown as { name?: string } | null;
    const slot = (b as unknown as { mentor_slots: { starts_at: string; ends_at: string } }).mentor_slots;
    const endMs = new Date(slot?.ends_at || 0).getTime();
    const isUpcoming = endMs > nowMs && b.status !== "completed" && b.status !== "cancelled" && b.status !== "refunded";

    return {
      bookingId: b.id,
      status: b.status,
      meetUrl: b.meet_url,
      studentFirstName: firstNameMap.get(b.user_id) || "Student",
      tierName: tier?.name || "Mentoring Session",
      startsAt: slot?.starts_at || "",
      endsAt: slot?.ends_at || "",
      isUpcoming,
    };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Mentor Sessions
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            View your upcoming and past student mentoring sessions.
          </p>
        </div>
        <div>
          <Link
            href="/builder"
            className="text-xs text-accent hover:underline font-semibold"
          >
            &larr; Back to Builder Projects
          </Link>
        </div>
      </div>

      <BuilderSessionsClient sessions={sessions} />
    </div>
  );
}
