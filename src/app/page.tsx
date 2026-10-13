import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "VTU Adda Projects | Engineering Kits for VTU Students",
  description:
    "Mini project and major project kits for VTU engineering students with source code, setup guide, report template, presentation template and viva questions.",
  robots: {
    index: false,
    follow: false,
  },
};

const FAQ_ITEMS = [
  {
    question: "Can I submit a kit as my own project?",
    answer:
      "No. A kit is a learning and reference resource. Your college expects your own work and you must be able to explain it in your viva. Use the kit to understand a working design, then customise it, extend it and write your own report.",
  },
  {
    question: "Which scheme and branch does a kit cover?",
    answer:
      "Each kit page lists its branch, semester and scheme. Use the filters on the project list.",
  },
  {
    question: "How do I get my files?",
    answer:
      "After we verify your payment, the files appear under My purchases and we send you an email. Each file can be downloaded a limited number of times.",
  },
  {
    question: "What if my payment is rejected?",
    answer:
      "We email you the reason and you can submit the correct UTR number again.",
  },
  {
    question: "Can you build a project on my own topic?",
    answer:
      "Yes, through a custom request. We review it, send a written scope and a price, and you take part in every milestone. We decline exam work, lab records and copied work.",
  },
  {
    question: "Do you give refunds?",
    answer:
      "The refund policy explains what can be refunded. Please read it before you buy.",
  },
];

export default function HomePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const safeJsonLd = JSON.stringify(faqSchema).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />

      <div className="mx-auto max-w-container px-4 py-12 sm:px-6 sm:py-16 space-y-16">
        {/* Hero Section */}
        <section className="max-w-3xl space-y-6">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl leading-tight">
            Mini project and major project kits for VTU engineering students
          </h1>
          <p className="text-base text-ink-2 leading-relaxed sm:text-lg">
            Each kit has the source code, a setup guide, report and presentation templates, and viva questions. You can also ask for a project built to your topic, or book a mentor to review your own work. Pay by UPI. We verify each payment by hand before releasing files.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <LinkButton href="/projects" variant="primary">
              Browse projects
            </LinkButton>
          </div>
        </section>

        {/* Three ways to get help */}
        <section className="space-y-6 border-t border-rule pt-12">
          <h2 className="text-xl font-serif font-bold text-ink">
            Three ways to get help
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-md border border-rule bg-surface space-y-2">
              <h3 className="font-semibold text-ink text-base">Project kits</h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                A finished, working project with everything you need to understand it, run it and present it. The price is shown on each page.
              </p>
            </div>
            <div className="p-6 rounded-md border border-rule bg-surface space-y-2">
              <h3 className="font-semibold text-ink text-base">Custom project</h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                Tell us your topic, branch and deadline. We reply with a written scope and a price. You take part in each milestone.
              </p>
            </div>
            <div className="p-6 rounded-md border border-rule bg-surface space-y-2">
              <h3 className="font-semibold text-ink text-base">Mentoring</h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                Book a session with a mentor to review your plan, code, report or presentation, or to practise your viva.
              </p>
            </div>
          </div>
        </section>

        {/* What is in a kit */}
        <section className="space-y-6 border-t border-rule pt-12">
          <h2 className="text-xl font-serif font-bold text-ink">
            What is in a kit
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-md border border-rule bg-paper space-y-1.5">
              <dt className="font-semibold text-ink text-sm">Source code</dt>
              <dd className="text-sm text-ink-2 leading-relaxed">
                The full project as a zip file, with a README.
              </dd>
            </div>
            <div className="p-5 rounded-md border border-rule bg-paper space-y-1.5">
              <dt className="font-semibold text-ink text-sm">Setup guide</dt>
              <dd className="text-sm text-ink-2 leading-relaxed">
                Step-by-step instructions to run the project on your own computer.
              </dd>
            </div>
            <div className="p-5 rounded-md border border-rule bg-paper space-y-1.5">
              <dt className="font-semibold text-ink text-sm">Report template</dt>
              <dd className="text-sm text-ink-2 leading-relaxed">
                A chapter outline with notes on what each chapter should cover. Your college may require its own format, so check it. You write the report in your own words.
              </dd>
            </div>
            <div className="p-5 rounded-md border border-rule bg-paper space-y-1.5">
              <dt className="font-semibold text-ink text-sm">Presentation template</dt>
              <dd className="text-sm text-ink-2 leading-relaxed">
                A slide outline for your project presentation.
              </dd>
            </div>
            <div className="p-5 rounded-md border border-rule bg-paper space-y-1.5 sm:col-span-2 lg:col-span-1">
              <dt className="font-semibold text-ink text-sm">Viva questions</dt>
              <dd className="text-sm text-ink-2 leading-relaxed">
                Questions your evaluators may ask, with explanations, so that you understand your project.
              </dd>
            </div>
          </dl>
        </section>

        {/* Find projects for your semester */}
        <section className="space-y-4 border-t border-rule pt-12">
          <h2 className="text-xl font-serif font-bold text-ink">
            Find projects for your semester
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/projects?type=mini_project"
              className="px-4 py-2 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-rule-strong hover:bg-paper transition-colors"
            >
              Mini project
            </Link>
            <Link
              href="/projects?type=project_phase_1"
              className="px-4 py-2 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-rule-strong hover:bg-paper transition-colors"
            >
              Project Phase I
            </Link>
            <Link
              href="/projects?type=major_project_phase_2"
              className="px-4 py-2 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-rule-strong hover:bg-paper transition-colors"
            >
              Major project Phase II
            </Link>
            <Link
              href="/projects?type=capstone"
              className="px-4 py-2 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-rule-strong hover:bg-paper transition-colors"
            >
              Capstone
            </Link>
          </div>
          <p className="text-xs text-ink-3">
            Course names and semesters differ by scheme and branch. Check your college&apos;s scheme document.
          </p>
        </section>

        {/* How we work */}
        <section className="space-y-3 border-t border-rule pt-12">
          <h2 className="text-xl font-serif font-bold text-ink">
            How we work
          </h2>
          <p className="text-sm text-ink-2 leading-relaxed max-w-2xl">
            Kits are for learning, reference and guided customisation. You must follow your college&apos;s and VTU&apos;s rules, and you must be able to explain every part of your project. We do not take exam work, lab records or copied work.
          </p>
        </section>

        {/* Questions (accessible disclosure list, no animation) */}
        <section className="space-y-6 border-t border-rule pt-12">
          <h2 className="text-xl font-serif font-bold text-ink">
            Questions
          </h2>
          <div className="space-y-3 max-w-3xl">
            {FAQ_ITEMS.map((item, idx) => (
              <details
                key={idx}
                className="group rounded-md border border-rule bg-surface p-4"
              >
                <summary className="font-medium text-ink text-sm cursor-pointer list-none flex items-center justify-between">
                  <span>{item.question}</span>
                  <span className="text-ink-3 text-xs group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-sm text-ink-2 leading-relaxed pt-2 border-t border-rule-subtle">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
