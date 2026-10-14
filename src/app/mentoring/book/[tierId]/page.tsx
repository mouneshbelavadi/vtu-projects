import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth";
import { createClient } from "@/server/supabase/server";
import { getSystemSettings } from "@/server/settings";
import { formatDate } from "@/lib/format";
import { BookingForm, type SlotGroup } from "./booking-form";

interface PageProps {
  params: Promise<{
    tierId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { tierId } = await params;
  const supabase = await createClient();
  const { data: tier } = await supabase
    .from("mentoring_tiers")
    .select("name")
    .eq("id", tierId)
    .single();

  return {
    title: tier ? `Book ${tier.name} | VTU Adda Project Hub` : "Book Mentoring Session",
    description: "Select an available time slot for your live mentoring session.",
  };
}

export default async function BookTierPage({ params }: PageProps) {
  const { tierId } = await params;
  await requireUser(`/mentoring/book/${tierId}`);

  const supabase = await createClient();

  // Load active tier
  const { data: tier } = await supabase
    .from("mentoring_tiers")
    .select("id, name, description, price_inr, session_minutes, active")
    .eq("id", tierId)
    .eq("active", true)
    .single();

  if (!tier) {
    notFound();
  }

  // Read minimum notice hours setting
  const settings = await getSystemSettings();
  const minNoticeHours = settings.mentoring_min_notice_hours || 12;

  const nowMs = Date.now();
  const earliestAllowed = new Date(nowMs + minNoticeHours * 60 * 60 * 1000).toISOString();
  const latestAllowed = new Date(nowMs + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Load open slots in the 30-day window
  const { data: slots } = await supabase
    .from("mentor_slots")
    .select("id, starts_at, ends_at, status")
    .eq("status", "open")
    .gte("starts_at", earliestAllowed)
    .lte("starts_at", latestAllowed)
    .order("starts_at", { ascending: true });

  const rawSlots = slots || [];

  // Group slots by IST date
  const groupsMap = new Map<string, SlotGroup["slots"]>();

  for (const s of rawSlots) {
    const dateLabel = formatDate(s.starts_at);
    if (!groupsMap.has(dateLabel)) {
      groupsMap.set(dateLabel, []);
    }
    groupsMap.get(dateLabel)!.push({
      id: s.id,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
    });
  }

  const slotGroups: SlotGroup[] = Array.from(groupsMap.entries()).map(
    ([dateLabel, groupSlots]) => ({
      dateLabel,
      slots: groupSlots,
    })
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
          Book Mentoring Session
        </h1>
        <p className="mt-2 text-sm text-ink-2">
          Select an available time slot for your {tier.name} session.
        </p>
      </div>

      <BookingForm
        tierId={tier.id}
        tierName={tier.name}
        priceInr={tier.price_inr}
        sessionMinutes={tier.session_minutes}
        slotGroups={slotGroups}
      />
    </div>
  );
}
