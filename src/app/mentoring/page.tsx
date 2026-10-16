import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/server/supabase/server";
import { formatInr } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import {
  Sparkles,
  Video,
  ShieldCheck,
  HelpCircle,
  Clock,
  Compass,
  Code2,
  FileText,
  Presentation,
  Award,
  UserCheck,
  CheckCircle2,
  CalendarCheck,
  CreditCard,
  ArrowRight,
} from "lucide-react";

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
    <div className="min-h-screen bg-paper">
      {/* 1. Hero Section with Gradient Background */}
      <section className="relative overflow-hidden border-b border-rule/70 bg-gradient-to-b from-indigo-50/60 via-surface to-surface-2/30 py-16 sm:py-20">
        {/* Ambient radial blur decoration */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-96 w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/10 via-violet-500/10 to-cyan-500/10 blur-3xl"
        />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/90 px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-xs backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>1-on-1 VTU Project Guidance</span>
          </div>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink font-heading sm:text-5xl lg:text-6xl animate-fade-in">
            1-on-1 Live{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Mentoring Sessions
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg animate-fade-in">
            Mentoring is a live session with a mentor. We review your own work and help you understand it. We do not write your project or your report.
          </p>

          {/* Trust / Context Pills Row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-ink-2 sm:gap-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rule/80 bg-surface px-3 py-1.5 shadow-xs">
              <Video className="h-4 w-4 text-indigo-600" />
              <span>Private Screen Share</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rule/80 bg-surface px-3 py-1.5 shadow-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>VTU Rubrics & Scheme Ready</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rule/80 bg-surface px-3 py-1.5 shadow-xs">
              <HelpCircle className="h-4 w-4 text-cyan-600" />
              <span>Mock Viva Preparation</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rule/80 bg-surface px-3 py-1.5 shadow-xs">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Flexible IST Slots</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. What a Session Can Cover: Icon-Led Feature Cards */}
      <section className="border-b border-rule/60 bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600">
              Interactive Scope
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink font-heading sm:text-3xl">
              What a session can cover
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink-2">
              Direct, interactive guidance focused strictly on helping you understand and defend your project.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-rule/80 bg-paper p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">
                Reviewing your project plan
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
                Examine system architecture, component choices, feasibility, and module decomposition.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-rule/80 bg-paper p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Code2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">
                Walking through your code
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
                Inspect logic line by line, understand execution flow, and debug tricky components.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-rule/80 bg-paper p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">
                Reviewing your report
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
                Align chapter organization, citations, block diagrams, and VTU formatting norms.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-rule/80 bg-paper p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Presentation className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">
                Practising your presentation
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
                Structure your slide deck, highlight contributions, and keep your timing on track.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-rule/80 bg-paper p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md sm:col-span-2 lg:col-span-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">
                A mock viva
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
                Simulate internal and external examiner questioning to build confidence before evaluation day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Available Sessions: Mentor / Plan Cards */}
      <section id="sessions" className="border-b border-rule/60 bg-gradient-to-b from-surface-2/40 via-surface to-surface-2/20 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600">
              Packages & Booking
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink font-heading sm:text-3xl">
              Available sessions
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink-2">
              Select a session package below to choose your date and preferred time slot.
            </p>
          </div>

          <div className="mt-12">
            {activeTiers.length === 0 ? (
              <Card className="mx-auto max-w-lg p-10 text-center bg-surface border border-rule/80 rounded-2xl shadow-sm">
                <Clock className="mx-auto h-8 w-8 text-indigo-500 mb-3" />
                <h3 className="text-base font-bold text-ink">Booking Currently Closed</h3>
                <p className="mt-1 text-sm text-ink-2">
                  Mentoring sessions are not open for booking yet.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                {activeTiers.map((tier, index) => {
                  const isPopular = index === 1 || activeTiers.length === 1;
                  return (
                    <div
                      key={tier.id}
                      className={`relative flex flex-col justify-between rounded-3xl transition-all duration-300 hover:-translate-y-1.5 ${
                        isPopular
                          ? "border-2 border-indigo-600 bg-surface p-7 sm:p-8 shadow-xl shadow-indigo-500/10 lg:scale-105 z-10"
                          : "border border-rule/80 bg-surface p-7 sm:p-8 shadow-sm hover:border-indigo-300 hover:shadow-lg"
                      }`}
                    >
                      {isPopular && (
                        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-1 text-xs font-bold text-white shadow-xs tracking-wide">
                          Most Popular
                        </span>
                      )}

                      <div>
                        {/* Avatar Ring & Role Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 text-indigo-600 shadow-xs ring-4 ring-indigo-500/10">
                            <UserCheck className="h-6 w-6 text-indigo-600" />
                          </div>
                          <span className="rounded-full bg-indigo-50/80 border border-indigo-100/80 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                            VTU Academic Mentor
                          </span>
                        </div>

                        {/* Plan Name & Duration */}
                        <h3 className="mt-4 text-xl font-bold tracking-tight text-ink font-heading">
                          {tier.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink-3 font-mono">
                          <Clock className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{tier.session_minutes} mins duration</span>
                        </div>

                        {/* Description */}
                        <p className="mt-3 min-h-[44px] text-xs leading-relaxed text-ink-2 sm:text-sm">
                          {tier.description || "Live 1-on-1 engineering guidance tailored to your project goals."}
                        </p>

                        {/* Price */}
                        <div className="mt-6 border-t border-rule/60 pt-5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-3xl font-extrabold tracking-tight text-ink font-heading">
                              {formatInr(tier.price_inr)}
                            </span>
                            <span className="text-xs font-medium text-ink-3">
                              / session
                            </span>
                          </div>
                        </div>

                        {/* Feature Checklist */}
                        <ul className="mt-6 space-y-2.5 text-xs text-ink-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                            <span>1-on-1 private video screen share</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                            <span>Detailed code walkthrough & architecture check</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                            <span>Viva defense questions & presentation coaching</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                            <span>Actionable suggestions for rubrics & report</span>
                          </li>
                        </ul>
                      </div>

                      {/* Styled CTA Button */}
                      <div className="mt-8">
                        <LinkButton
                          href={`/mentoring/book/${tier.id}`}
                          variant={isPopular ? "primary" : "secondary"}
                          size="lg"
                          className="w-full font-semibold shadow-xs"
                        >
                          Choose a time
                        </LinkButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. How Booking Works: Step-by-Step Flow */}
      <section className="border-b border-rule/60 bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-rule/80 bg-paper p-6 sm:p-10 shadow-xs">
            <div className="border-b border-rule/70 pb-6">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600">
                Simple Booking
              </span>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-ink font-heading sm:text-2xl">
                How booking works
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2 max-w-3xl">
                Choose a session, choose a time, pay by UPI, and we confirm the booking and send the meeting link after we verify your payment.
              </p>
            </div>

            {/* 4-Step Diagram */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-rule/80 bg-surface p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                  1
                </div>
                <div className="mt-3 text-sm font-semibold text-ink">Choose a session</div>
                <p className="mt-1 text-xs text-ink-3">Select a package based on the duration you need.</p>
              </div>

              <div className="rounded-2xl border border-rule/80 bg-surface p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                  2
                </div>
                <div className="mt-3 text-sm font-semibold text-ink">Choose a time</div>
                <p className="mt-1 text-xs text-ink-3">Pick an available IST slot at least 12 hours ahead.</p>
              </div>

              <div className="rounded-2xl border border-rule/80 bg-surface p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                  3
                </div>
                <div className="mt-3 text-sm font-semibold text-ink">Pay by UPI</div>
                <p className="mt-1 text-xs text-ink-3">Complete payment and upload your transaction reference.</p>
              </div>

              <div className="rounded-2xl border border-rule/80 bg-surface p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-600">
                  4
                </div>
                <div className="mt-3 text-sm font-semibold text-ink">Meeting confirmed</div>
                <p className="mt-1 text-xs text-ink-3">Receive your private video meeting link once verified.</p>
              </div>
            </div>

            {/* Subtext and Policy Links */}
            <div className="mt-8 pt-6 border-t border-rule/70 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ink-3">
              <span>
                All sessions are held in Indian Standard Time (IST). Sessions must be booked at least 12 hours in advance.
              </span>
              <div className="flex items-center gap-5 shrink-0">
                <Link
                  href="/refund"
                  className="font-medium text-accent underline underline-offset-2 hover:text-indigo-800 transition-colors"
                >
                  Cancellation & refund policy &rarr;
                </Link>
                <Link
                  href="/contact"
                  className="font-medium text-accent underline underline-offset-2 hover:text-indigo-800 transition-colors"
                >
                  Contact support &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Closing CTA Banner Using Existing Links */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16">
          {/* Ambient Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
          />

          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight font-heading sm:text-3xl lg:text-4xl">
              Need Project Kits or Custom Builds?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Browse verified academic project kits with source code and reports, or submit your topic for a custom milestone build.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <LinkButton
                href="/projects"
                variant="primary"
                size="lg"
                className="bg-white text-indigo-950 hover:bg-slate-100 shadow-md font-bold"
              >
                Browse Project Kits
              </LinkButton>
              <LinkButton
                href="/request"
                variant="secondary"
                size="lg"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold"
              >
                Request Custom Project
              </LinkButton>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white underline underline-offset-4 ml-1 transition-colors"
              >
                Ask a question &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
