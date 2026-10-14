import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/server/supabase/server";
import { formatInr } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Engineering Project Mentoring | VTU Adda",
  description:
    "Book 1-on-1 mentoring sessions for VTU engineering projects: code walkthroughs, viva preparation and report reviews.",
  alternates: {
    canonical: "https://projects.vtuadda.com/mentoring",
  },
  openGraph: {
    title: "Engineering Project Mentoring | VTU Adda",
    description:
      "Book 1-on-1 mentoring sessions for VTU engineering projects: code walkthroughs, viva preparation and report reviews.",
    url: "https://projects.vtuadda.com/mentoring",
  },
  twitter: {
    card: "summary_large_image",
    title: "Engineering Project Mentoring | VTU Adda",
    description:
      "Book 1-on-1 mentoring sessions for VTU engineering projects: code walkthroughs, viva preparation and report reviews.",
  },
};

export default async function MentoringPage() {
  const supabase = await createClient();

  // Read only active tiers from the database
  const { data: tiers } = await supabase
    .from("mentoring_tiers")
    .select("id, name, description, session_minutes, price_inr, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("price_inr", { ascending: true });

  const activeTiers = tiers || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 border-b border-rule pb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Mentoring Sessions
        </h1>
        <p className="mt-3 text-base text-ink-2 max-w-3xl leading-relaxed">
          Mentoring is a live session with a mentor. We review your own work and help you understand it. We do not write your project or your report.
        </p>
      </div>

      {/* What a session can cover */}
      <div className="mb-10">
        <h2 className="font-serif text-xl font-bold text-ink mb-4">
          What a session can cover
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink-2">
          <li>Reviewing your project plan</li>
          <li>Walking through your code</li>
          <li>Reviewing your report</li>
          <li>Practising your presentation</li>
          <li>A mock viva</li>
        </ul>
      </div>

      {/* Available Tiers */}
      <div className="mb-12">
        <h2 className="font-serif text-xl font-bold text-ink mb-4">
          Available sessions
        </h2>

        {activeTiers.length === 0 ? (
          <Card className="p-8 text-center bg-paper">
            <p className="text-sm text-ink-2">
              Mentoring sessions are not open for booking yet.
            </p>
          </Card>
        ) : (
          <div className="overflow-x-auto border border-rule rounded-md bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Session name</TableHead>
                  <TableHead className="w-2/5">Description</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell className="font-medium text-ink">
                      {tier.name}
                    </TableCell>
                    <TableCell className="text-sm text-ink-2">
                      {tier.description || "-"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono text-ink">
                      {tier.session_minutes} mins
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-ink">
                      {formatInr(tier.price_inr)}
                    </TableCell>
                    <TableCell className="text-right">
                      <LinkButton
                        href={`/mentoring/book/${tier.id}`}
                        variant="primary"
                        size="sm"
                      >
                        Choose a time
                      </LinkButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* How booking works */}
      <div className="rounded-md border border-rule bg-paper p-6 sm:p-8">
        <h2 className="font-serif text-lg font-bold text-ink mb-3">
          How booking works
        </h2>
        <p className="text-sm text-ink-2 leading-relaxed">
          Choose a session, choose a time, pay by UPI, and we confirm the booking and send the meeting link after we verify your payment.
        </p>
        <div className="mt-4 pt-4 border-t border-rule text-xs text-ink-3">
          Cancellation policy: Cancellation requests must be submitted at least 24 hours before your scheduled session. All times are scheduled in Indian Standard Time (IST).
        </div>
      </div>
    </div>
  );
}
