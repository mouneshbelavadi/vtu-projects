import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserOrNull } from "@/server/auth";
import { RequestForm } from "./request-form";
import {
  Sparkles,
  Layers,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Send,
  FileSearch,
  CreditCard,
  Hammer,
  HelpCircle,
} from "lucide-react";

export const metadata = {
  title: "Custom Project Build Request | VTU Adda",
  description:
    "Submit your custom VTU engineering project topic. Receive a written scope, milestone roadmap, and clear quote.",
  alternates: {
    canonical: "https://projects.vtuadda.com/request",
  },
  openGraph: {
    title: "Custom Project Build Request | VTU Adda",
    description:
      "Submit your custom VTU engineering project topic. Receive a written scope, milestone roadmap, and clear quote.",
    url: "https://projects.vtuadda.com/request",
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom Project Build Request | VTU Adda",
    description:
      "Submit your custom VTU engineering project topic. Receive a written scope, milestone roadmap, and clear quote.",
  },
};

export default async function RequestPage() {
  const authUser = await getUserOrNull();

  if (!authUser) {
    redirect("/login?next=%2Frequest");
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-b from-surface-2/40 via-surface to-surface-2/30 py-10 sm:py-14">
      {/* Ambient background blur elements */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/4 top-10 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-10 top-40 -z-10 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Persuasive Context */}
          <div className="space-y-8 lg:col-span-5 lg:sticky lg:top-24">
            {/* Header Block */}
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/90 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                Custom Engineering Build
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-ink font-heading sm:text-4xl">
                Request a Custom{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Project
                </span>
              </h1>
              <p className="text-sm leading-relaxed text-ink-2 sm:text-base">
                Tell us about your proposed VTU engineering project. Our team reviews your problem statement and provides a written scope, milestone plan, and price before any work begins.
              </p>
            </div>

            {/* Benefits List */}
            <div className="rounded-2xl border border-rule/70 bg-surface/80 p-5 backdrop-blur-sm shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-3">
                Why build with VTU Adda
              </h2>
              <ul className="mt-4 space-y-3.5">
                <li className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">VTU Syllabus Alignment</h3>
                    <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">
                      Tailored to 2022, 2021, and 2018 VTU scheme requirements and rubrics.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Milestone Deliverables</h3>
                    <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">
                      Includes source code, setup walkthrough, report template, and viva defense questions.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Transparent Scoping</h3>
                    <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">
                      Written scope of work and clear pricing before paying any deposit.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* How it works: 4-Step Process Timeline */}
            <section className="rounded-2xl border border-rule/80 bg-surface p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-rule/60">
                <h2 className="text-base font-bold text-ink font-heading">
                  How custom projects work
                </h2>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  4 Steps
                </span>
              </div>

              <div className="relative mt-6 space-y-6 pl-2">
                {/* Connecting vertical line */}
                <div
                  aria-hidden="true"
                  className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent"
                />

                {/* Step 1 */}
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-indigo-600 bg-surface text-xs font-bold text-indigo-600 shadow-xs">
                    1
                  </div>
                  <div className="pt-0.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">Step 1</div>
                    <div className="text-sm font-semibold text-ink mt-0.5">You send the request</div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-3">
                      Describe your title, problem brief, scheme, semester, branch, and any technology preferences.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-indigo-500 bg-surface text-xs font-bold text-indigo-600 shadow-xs">
                    2
                  </div>
                  <div className="pt-0.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">Step 2</div>
                    <div className="text-sm font-semibold text-ink mt-0.5">We reply with scope and price</div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-3">
                      We reply with a written scope of work, milestone timeline, total price, and deposit amount.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-indigo-400 bg-surface text-xs font-bold text-indigo-600 shadow-xs">
                    3
                  </div>
                  <div className="pt-0.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">Step 3</div>
                    <div className="text-sm font-semibold text-ink mt-0.5">You accept and pay a deposit</div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-3">
                      You review the milestones. You are not charged anything until you formally accept the quote and pay the deposit.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-surface text-xs font-bold text-emerald-600 shadow-xs">
                    4
                  </div>
                  <div className="pt-0.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Step 4</div>
                    <div className="text-sm font-semibold text-ink mt-0.5">We build in milestones</div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-3">
                      Our assigned builder works through milestones, you take part in each one, and final files release after balance payment.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Refusal Box: What we do not take */}
            <section className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-rose-800">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                <h2 className="text-sm font-bold text-rose-900">
                  What we do not take
                </h2>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-rose-900/90">
                In accordance with VTU academic regulations and our{" "}
                <Link
                  href="/academic-integrity"
                  className="font-semibold text-rose-950 underline underline-offset-2 hover:text-rose-800"
                >
                  academic integrity policy
                </Link>
                , we strictly decline:
              </p>
              <ul className="mt-3 space-y-2 text-xs text-rose-950/80">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>Exam answers or live assessment help</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>Lab records, manual write-ups, or assignment copying</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>Work another student has already submitted in previous semesters</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>Copied or plagiarised work from online repositories</span>
                </li>
              </ul>
            </section>
          </div>

          {/* Right Column: Application Form Card */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl border border-rule/80 bg-surface p-6 shadow-xl shadow-slate-900/5 sm:p-8 lg:p-10">
              {/* Form Heading & Context */}
              <div className="border-b border-rule/70 pb-6 mb-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight text-ink font-heading sm:text-2xl">
                    Custom Project Application
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-3 border border-rule/60">
                    <HelpCircle className="h-3 w-3 text-ink-4" />
                    Private Submission
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-3 sm:text-sm">
                  Fill in your project details below. Branch, semester, and scheme live strictly on this request and are never added to your account profile.
                </p>
              </div>

              {/* The Actual Interactive Form */}
              <RequestForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
