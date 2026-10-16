import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { LinkButton } from "@/components/ui/button";
import { howItWorksLastUpdated } from "@/content/legal/how-it-works";
import {
  Sparkles,
  Layers,
  Search,
  ShoppingCart,
  QrCode,
  FileCheck2,
  ShieldCheck,
  Download,
  Send,
  FileSpreadsheet,
  CreditCard,
  GitBranch,
  PackageCheck,
  GraduationCap,
  Calendar,
  Lock,
  Video,
  Users,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Clock,
  Compass,
  FileText,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works | VTU Adda Projects",
  description:
    "Learn how ready kits, custom builds, manual UPI verification and mentoring work on VTU Adda Projects.",
  alternates: {
    canonical: "https://projects.vtuadda.com/how-it-works",
  },
  openGraph: {
    title: "How It Works | VTU Adda Projects",
    description:
      "Learn how ready kits, custom builds, manual UPI verification and mentoring work on VTU Adda Projects.",
    url: "https://projects.vtuadda.com/how-it-works",
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works | VTU Adda Projects",
    description:
      "Learn how ready kits, custom builds, manual UPI verification and mentoring work on VTU Adda Projects.",
  },
};

const PATH_1_STEPS = [
  {
    number: "01",
    title: "Select your kit:",
    detail:
      "Explore complete project summaries, architecture overviews, tech stacks, and preview media.",
    icon: Search,
  },
  {
    number: "02",
    title: "Proceed to checkout:",
    detail:
      "A unique order code (e.g. VPH-89ABCDEF) is generated. You have a 2-hour payment window before the order expires.",
    icon: ShoppingCart,
  },
  {
    number: "03",
    title: "Pay via manual UPI:",
    detail:
      "Scan the displayed UPI QR code or copy our Virtual Payment Address (VPA) into your UPI app (Google Pay, PhonePe, Paytm, or BHIM). Pay the exact total shown.",
    icon: QrCode,
  },
  {
    number: "04",
    title: "Submit your UTR:",
    detail:
      "Enter your 12-digit bank reference number (UTR) on the checkout screen. You may also attach an optional payment screenshot.",
    icon: FileCheck2,
  },
  {
    number: "05",
    title: "Manual verification:",
    detail:
      "Our administrators verify the bank receipt against our account statements during business hours (9:00 AM to 8:00 PM IST).",
    icon: ShieldCheck,
  },
  {
    number: "06",
    title: "Download deliverables:",
    detail:
      "Once verified, your deliverables unlock immediately. You receive the complete source code archive, draft project report, installation readme, viva questions, and your personalized licence slip. Each file allows up to 10 downloads.",
    icon: Download,
  },
];

const PATH_2_STEPS = [
  {
    number: "01",
    title: "Submit your request:",
    detail:
      "Fill out the custom build form on our website. Specify your branch, semester, scheme, deadline, team size (1 to 4 students), and detailed requirements brief.",
    icon: Send,
  },
  {
    number: "02",
    title: "Review and quotation:",
    detail:
      "Our builders assess the scope and reply with a milestone roadmap and fixed price quote.",
    icon: FileSpreadsheet,
  },
  {
    number: "03",
    title: "Deposit payment:",
    detail:
      "Pay the 50 percent booking deposit via manual UPI to initiate development.",
    icon: CreditCard,
  },
  {
    number: "04",
    title: "Milestone checkpoints:",
    detail:
      "Track implementation progress through dedicated stages. Test code modules and submit feedback directly in the project portal.",
    icon: GitBranch,
  },
  {
    number: "05",
    title: "Balance and final delivery:",
    detail:
      "Review the project demonstration, clear the remaining balance, and download the finished source code, report, and documentation.",
    icon: PackageCheck,
  },
];

const PATH_3_STEPS = [
  {
    number: "01",
    title: "Choose a mentoring tier:",
    detail:
      "Select a suitable session package (Quick Viva Prep, Architecture Deep Dive, or Comprehensive Full Project Review).",
    icon: GraduationCap,
  },
  {
    number: "02",
    title: "Select a date and time slot:",
    detail:
      "Browse open calendar slots in Indian Standard Time (IST). Slots must be booked at least 12 hours in advance.",
    icon: Calendar,
  },
  {
    number: "03",
    title: "Hold and confirm:",
    detail:
      "Your selected slot is held for 2 hours while you complete UPI payment.",
    icon: Lock,
  },
  {
    number: "04",
    title: "Access meeting link:",
    detail:
      "Once approved, the secure video conference link (Google Meet) appears in your student dashboard.",
    icon: Video,
  },
  {
    number: "05",
    title: "Attend session:",
    detail:
      "Join the live video call with your mentor at the scheduled time. We send an email reminder 24 hours prior to your session.",
    icon: Users,
  },
];

const FAQ_LIST = [
  {
    question: "Can I submit a kit as my own project?",
    answer: (
      <>
        No. A kit is a learning and reference resource. Your college expects your own work and you must be able to explain it in your viva. Read our{" "}
        <Link href="/academic-integrity" className="text-accent underline font-medium">
          academic integrity guidelines
        </Link>
        . Use the kit to understand a working design, then customise it, extend it and write your own report.
      </>
    ),
  },
  {
    question: "Which scheme and branch does a kit cover?",
    answer: (
      <>
        Each kit page lists its branch, semester and scheme. You can use the{" "}
        <Link href="/projects" className="text-accent underline font-medium">
          filters on the project catalogue
        </Link>{" "}
        to browse by your specific course requirements.
      </>
    ),
  },
  {
    question: "How do I get my files?",
    answer: (
      <>
        After we verify your UPI payment, the files appear under{" "}
        <Link href="/account/orders" className="text-accent underline font-medium">
          My purchases
        </Link>{" "}
        and we send you a confirmation email. Each file can be downloaded a limited number of times. See how delivery works.
      </>
    ),
  },
  {
    question: "What if my payment is rejected?",
    answer: (
      <>
        We email you the reason and you can submit the correct UTR number again from your{" "}
        <Link href="/account/orders" className="text-accent underline font-medium">
          order status page
        </Link>
        . If you need help, you can{" "}
        <Link href="/contact" className="text-accent underline font-medium">
          contact our support team
        </Link>
        .
      </>
    ),
  },
  {
    question: "Can you build a project on my own topic?",
    answer: (
      <>
        Yes, through a{" "}
        <Link href="/request" className="text-accent underline font-medium">
          custom project request
        </Link>
        . We review your requirements, send a written scope and a milestone quote, and you take part in each milestone. We decline exam work, lab records and copied work.
      </>
    ),
  },
  {
    question: "Do you give refunds?",
    answer: (
      <>
        Our{" "}
        <Link href="/refund" className="text-accent underline font-medium">
          refund policy
        </Link>{" "}
        explains what can be refunded. Please review the details before you purchase.
      </>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-paper pb-20">
      {/* 1. Page Header with Gradient Mesh */}
      <section className="relative overflow-hidden border-b border-rule/70 bg-gradient-to-b from-indigo-50/60 via-surface to-surface-2/30 py-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-96 w-[650px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/10 via-violet-500/10 to-cyan-500/10 blur-3xl"
        />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "How It Works" },
              ]}
            />
          </div>

          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/90 px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-xs backdrop-blur-sm animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Step-by-Step Walkthrough</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink font-heading sm:text-5xl animate-fade-in">
              How{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                It Works
              </span>
            </h1>

            <p className="mt-2 text-xs text-ink-3">
              Last updated: {howItWorksLastUpdated}
            </p>

            <div className="mt-6 rounded-2xl border border-rule/80 bg-surface/90 p-5 sm:p-6 backdrop-blur-sm shadow-xs max-w-3xl">
              <h2 className="text-base sm:text-lg font-bold text-ink font-heading">
                Three Clear Paths to Academic Success
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-2">
                VTU Adda Projects is designed specifically for VTU engineering students seeking high-quality project kits, custom engineering guidance, or expert technical mentorship. Here is how each service functions from start to finish.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Timelines Container */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 sm:space-y-24">
        {/* PATH 1: Ready Project Kits */}
        <section id="ready-kits" className="scroll-mt-20">
          <div className="border-b border-rule/70 pb-6 mb-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600">
              Path 01
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ink font-heading">
              Path 1: Ready Project Kits
            </h2>
            <p className="mt-2 text-sm text-ink-2 max-w-2xl leading-relaxed">
              Browse our catalog of vetted engineering projects across Computer Science, Information Science, Electronics, and Mechanical Engineering.
            </p>
          </div>

          {/* Path 1 Animated Timeline */}
          <div className="relative pl-3 sm:pl-6 space-y-6 sm:space-y-8 before:absolute before:left-[27px] sm:before:left-[35px] before:top-6 before:bottom-6 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-indigo-300 before:to-indigo-100">
            {PATH_1_STEPS.map((step) => {
              const IconComp = step.icon;
              return (
                <div key={step.number} className="relative flex items-start gap-4 sm:gap-6 group">
                  {/* Large Numbered Gradient Circle */}
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white font-extrabold text-sm sm:text-base shadow-md ring-4 ring-indigo-500/10 z-10 transition-transform duration-300 group-hover:scale-105">
                    {step.number}
                  </div>

                  {/* Card-Style Step Description */}
                  <div className="flex-1 rounded-2xl border border-rule/80 bg-surface p-5 sm:p-6 shadow-xs transition-all duration-300 group-hover:border-indigo-300 group-hover:shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-ink font-heading">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-ink-2 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-4 pl-16 sm:pl-20">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 font-semibold text-accent underline underline-offset-4 hover:text-indigo-800 transition-colors text-sm"
            >
              Browse ready project kits &rarr;
            </Link>
          </div>
        </section>

        {/* PATH 2: Custom Project Development */}
        <section id="custom-builds" className="scroll-mt-20">
          <div className="border-b border-rule/70 pb-6 mb-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600">
              Path 02
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ink font-heading">
              Path 2: Custom Project Development
            </h2>
            <p className="mt-2 text-sm text-ink-2 max-w-2xl leading-relaxed">
              If your college has assigned a unique problem statement or requires specific technologies, our builder team can construct a tailored build.
            </p>
          </div>

          {/* Path 2 Animated Timeline */}
          <div className="relative pl-3 sm:pl-6 space-y-6 sm:space-y-8 before:absolute before:left-[27px] sm:before:left-[35px] before:top-6 before:bottom-6 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-indigo-300 before:to-indigo-100">
            {PATH_2_STEPS.map((step) => {
              const IconComp = step.icon;
              return (
                <div key={step.number} className="relative flex items-start gap-4 sm:gap-6 group">
                  {/* Large Numbered Gradient Circle */}
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white font-extrabold text-sm sm:text-base shadow-md ring-4 ring-indigo-500/10 z-10 transition-transform duration-300 group-hover:scale-105">
                    {step.number}
                  </div>

                  {/* Card-Style Step Description */}
                  <div className="flex-1 rounded-2xl border border-rule/80 bg-surface p-5 sm:p-6 shadow-xs transition-all duration-300 group-hover:border-indigo-300 group-hover:shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-ink font-heading">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-ink-2 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-4 pl-16 sm:pl-20">
            <Link
              href="/request"
              className="inline-flex items-center gap-2 font-semibold text-accent underline underline-offset-4 hover:text-indigo-800 transition-colors text-sm"
            >
              Submit a custom project request &rarr;
            </Link>
          </div>
        </section>

        {/* PATH 3: One-on-One Technical Mentoring */}
        <section id="mentoring-path" className="scroll-mt-20">
          <div className="border-b border-rule/70 pb-6 mb-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600">
              Path 03
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ink font-heading">
              Path 3: One-on-One Technical Mentoring
            </h2>
            <p className="mt-2 text-sm text-ink-2 max-w-2xl leading-relaxed">
              Book direct sessions with experienced builders to prepare for viva voce examinations, clarify code logic, or debug tricky issues.
            </p>
          </div>

          {/* Path 3 Animated Timeline */}
          <div className="relative pl-3 sm:pl-6 space-y-6 sm:space-y-8 before:absolute before:left-[27px] sm:before:left-[35px] before:top-6 before:bottom-6 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-indigo-300 before:to-indigo-100">
            {PATH_3_STEPS.map((step) => {
              const IconComp = step.icon;
              return (
                <div key={step.number} className="relative flex items-start gap-4 sm:gap-6 group">
                  {/* Large Numbered Gradient Circle */}
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white font-extrabold text-sm sm:text-base shadow-md ring-4 ring-indigo-500/10 z-10 transition-transform duration-300 group-hover:scale-105">
                    {step.number}
                  </div>

                  {/* Card-Style Step Description */}
                  <div className="flex-1 rounded-2xl border border-rule/80 bg-surface p-5 sm:p-6 shadow-xs transition-all duration-300 group-hover:border-indigo-300 group-hover:shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-ink font-heading">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-ink-2 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-4 pl-16 sm:pl-20">
            <Link
              href="/mentoring"
              className="inline-flex items-center gap-2 font-semibold text-accent underline underline-offset-4 hover:text-indigo-800 transition-colors text-sm"
            >
              Explore mentoring tiers &rarr;
            </Link>
          </div>
        </section>

        {/* Transparent and Reliable Note */}
        <section className="rounded-3xl border border-rule/80 bg-surface p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-ink font-heading">
                Transparent and Reliable
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-ink-2">
                Have questions about any of our processes? Visit our{" "}
                <Link href="/contact" className="text-accent underline font-semibold">
                  Contact page
                </Link>{" "}
                or review our{" "}
                <Link href="/terms" className="text-accent underline font-semibold">
                  Terms and Conditions
                </Link>
                .
              </p>
            </div>
            <LinkButton href="/contact" variant="secondary" size="sm" className="shrink-0 font-semibold">
              Contact Support
            </LinkButton>
          </div>
        </section>

        {/* 2. Polished FAQ-Style Accordion */}
        <section id="faq" className="border-t border-rule/70 pt-16">
          <div className="text-center sm:text-left mb-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600">
              Frequently Asked Questions
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ink font-heading">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-ink-2 max-w-2xl leading-relaxed">
              Clear answers regarding kit deliveries, verification timelines, and academic integrity guidelines.
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_LIST.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-2xl border border-rule/80 bg-surface p-5 sm:p-6 transition-all duration-200 open:border-indigo-300 open:shadow-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-ink text-sm sm:text-base list-none select-none">
                  <span className="pr-4">{faq.question}</span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-3 transition-transform duration-200 group-open:rotate-180 group-open:bg-indigo-50 group-open:text-indigo-600">
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </summary>
                <div className="mt-3.5 border-t border-rule/50 pt-3.5 text-xs sm:text-sm leading-relaxed text-ink-2">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* 3. Bold CTA Banner Linking to Existing Routes */}
        <section className="pt-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
            />

            <div className="relative z-10 max-w-2xl">
              <h2 className="text-2xl font-extrabold tracking-tight font-heading sm:text-3xl lg:text-4xl">
                Ready to Start Your Engineering Project?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                Browse vetted academic project kits with source code and reports, or submit your unique problem statement for a custom build.
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
                <LinkButton
                  href="/mentoring"
                  variant="quiet"
                  size="lg"
                  className="text-white hover:text-indigo-200 hover:bg-white/5 font-semibold"
                >
                  Book Mentoring
                </LinkButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
