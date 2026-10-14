import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { ProjectCard } from "@/components/catalogue/project-card";
import { getLiveProjects, type ProjectCatalogueItem } from "@/server/projects/catalogue";
import { siteConfig } from "../../site.config";

export const metadata: Metadata = {
  title: "VTU Adda Projects | Engineering Kits",
  description:
    "Mini and major project kits for VTU engineering students with source code, setup guide, report template and viva questions.",
  alternates: {
    canonical: siteConfig.siteUrl || "https://projects.vtuadda.com",
  },
  openGraph: {
    title: "VTU Adda Projects | Engineering Kits",
    description:
      "Mini and major project kits for VTU engineering students with source code, setup guide, report template and viva questions.",
    url: siteConfig.siteUrl || "https://projects.vtuadda.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "VTU Adda Projects | Engineering Kits",
    description:
      "Mini and major project kits for VTU engineering students with source code, setup guide, report template and viva questions.",
  },
};

interface FaqItem {
  question: string;
  answerText: string;
  answerJsx: React.ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Can I submit a kit as my own project?",
    answerText:
      "No. A kit is a learning and reference resource. Your college expects your own work and you must be able to explain it in your viva. Read our academic integrity policy. Use the kit to understand a working design, then customise it, extend it and write your own report.",
    answerJsx: (
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
    answerText:
      "Each kit page lists its branch, semester and scheme. You can use the filters on the project catalogue to browse by your specific course requirements.",
    answerJsx: (
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
    answerText:
      "After we verify your UPI payment, the files appear under My purchases and we send you a confirmation email. Each file can be downloaded a limited number of times. See how delivery works.",
    answerJsx: (
      <>
        After we verify your UPI payment, the files appear under{" "}
        <Link href="/account/orders" className="text-accent underline font-medium">
          My purchases
        </Link>{" "}
        and we send you a confirmation email. Each file can be downloaded a limited number of times. See{" "}
        <Link href="/how-it-works" className="text-accent underline font-medium">
          how delivery works
        </Link>
        .
      </>
    ),
  },
  {
    question: "What if my payment is rejected?",
    answerText:
      "We email you the reason and you can submit the correct UTR number again from your order status page. If you need help, you can contact our support team.",
    answerJsx: (
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
    answerText:
      "Yes, through a custom request. We review your requirements, send a written scope and a milestone quote, and you take part in each milestone. We decline exam work, lab records and copied work.",
    answerJsx: (
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
    answerText:
      "Our refund policy explains what can be refunded. Please review the details before you purchase.",
    answerJsx: (
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

export default async function HomePage() {
  let featuredProjects: ProjectCatalogueItem[] = [];
  try {
    const result = await getLiveProjects({ sort: "newest", page: 1 });
    featuredProjects = (result.projects || []).slice(0, 3);
  } catch {
    featuredProjects = [];
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.businessName || "VTU Adda Projects",
    url: siteConfig.siteUrl || "https://projects.vtuadda.com",
    email: siteConfig.supportEmail || "support@vtuadda.com",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answerText,
      },
    })),
  };

  return (
    <>
      <JsonLd data={[organizationSchema, faqSchema]} />

      <div className="mx-auto max-w-container px-4 py-12 sm:px-6 sm:py-16 space-y-16">
        {/* Hero Section */}
        <section className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-rule bg-surface text-xs font-medium text-ink-2">
            <span>VTU 2022 & 2018 Schemes</span>
            <span className="text-rule-strong">•</span>
            <span>CSE, ISE, ECE & Mechanical</span>
          </div>

          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl leading-tight">
            Mini project and major project kits for VTU engineering students
          </h1>

          <p className="text-base text-ink-2 leading-relaxed sm:text-lg">
            Each kit has the source code, a setup guide, report and presentation templates, and viva questions. You can also ask for a project built to your topic, or book a mentor to review your own work. Pay by UPI. We verify each payment by hand before releasing files.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <LinkButton href="/projects" variant="primary">
              Browse projects
            </LinkButton>
            <LinkButton href="/request" variant="secondary">
              Request custom project
            </LinkButton>
            <LinkButton href="/mentoring" variant="secondary">
              Book mentoring
            </LinkButton>
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-ink-2 hover:text-ink hover:underline px-2 py-2"
            >
              How it works &rarr;
            </Link>
          </div>
        </section>

        {/* Three ways to get help */}
        <section className="space-y-6 border-t border-rule pt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-serif font-bold text-ink">
                Three ways to get help
              </h2>
              <p className="text-sm text-ink-2 mt-1">
                Choose the path that fits your current semester timeline and requirements.
              </p>
            </div>
            <Link
              href="/how-it-works"
              className="text-xs font-semibold text-accent hover:underline hidden sm:inline-flex items-center gap-1"
            >
              Compare all services &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Project kits */}
            <Link
              href="/projects"
              className="group flex flex-col justify-between p-6 rounded-md border border-rule bg-surface hover:border-ink hover:bg-paper transition-all cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-accent">
                    Ready deliverables
                  </span>
                  <span className="text-sm text-ink-3 group-hover:text-ink transition-colors">
                    &rarr;
                  </span>
                </div>
                <h3 className="font-serif font-bold text-ink text-lg group-hover:text-accent transition-colors">
                  Project kits
                </h3>
                <p className="text-sm text-ink-2 leading-relaxed">
                  A finished, working project with everything you need to understand it, run it and present it. The price is shown on each page.
                </p>
              </div>
              <div className="pt-6 border-t border-rule-subtle mt-6 flex items-center justify-between text-xs font-semibold text-ink">
                <span className="text-ink-2">Instant download on verification</span>
                <span className="text-accent group-hover:underline">Browse kits &rarr;</span>
              </div>
            </Link>

            {/* Card 2: Custom project */}
            <Link
              href="/request"
              className="group flex flex-col justify-between p-6 rounded-md border border-rule bg-surface hover:border-ink hover:bg-paper transition-all cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-accent">
                    Built to your topic
                  </span>
                  <span className="text-sm text-ink-3 group-hover:text-ink transition-colors">
                    &rarr;
                  </span>
                </div>
                <h3 className="font-serif font-bold text-ink text-lg group-hover:text-accent transition-colors">
                  Custom project
                </h3>
                <p className="text-sm text-ink-2 leading-relaxed">
                  Tell us your topic, branch and deadline. We reply with a written scope and a price. You take part in each milestone.
                </p>
              </div>
              <div className="pt-6 border-t border-rule-subtle mt-6 flex items-center justify-between text-xs font-semibold text-ink">
                <span className="text-ink-2">Milestone payments</span>
                <span className="text-accent group-hover:underline">Request a project &rarr;</span>
              </div>
            </Link>

            {/* Card 3: Mentoring */}
            <Link
              href="/mentoring"
              className="group flex flex-col justify-between p-6 rounded-md border border-rule bg-surface hover:border-ink hover:bg-paper transition-all cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-accent">
                    1-on-1 Guidance
                  </span>
                  <span className="text-sm text-ink-3 group-hover:text-ink transition-colors">
                    &rarr;
                  </span>
                </div>
                <h3 className="font-serif font-bold text-ink text-lg group-hover:text-accent transition-colors">
                  Mentoring
                </h3>
                <p className="text-sm text-ink-2 leading-relaxed">
                  Book a session with a mentor to review your plan, code, report or presentation, or to practise your viva.
                </p>
              </div>
              <div className="pt-6 border-t border-rule-subtle mt-6 flex items-center justify-between text-xs font-semibold text-ink">
                <span className="text-ink-2">Live Google Meet call</span>
                <span className="text-accent group-hover:underline">Book a session &rarr;</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Featured project kits (when available) */}
        {featuredProjects.length > 0 && (
          <section className="space-y-6 border-t border-rule pt-12">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-bold text-ink">
                  Featured project kits
                </h2>
                <p className="text-sm text-ink-2 mt-1">
                  Verified working source code, reports, presentations and viva preparation.
                </p>
              </div>
              <Link
                href="/projects"
                className="text-sm font-semibold text-accent hover:underline hidden sm:inline-flex items-center gap-1"
              >
                View all kits &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            <div className="sm:hidden text-center pt-2">
              <LinkButton href="/projects" variant="secondary" className="w-full">
                View all kits &rarr;
              </LinkButton>
            </div>
          </section>
        )}

        {/* What is in a kit */}
        <section className="space-y-6 border-t border-rule pt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-serif font-bold text-ink">
                What is in a kit
              </h2>
              <p className="text-sm text-ink-2 mt-1">
                Every kit contains five essential deliverables designed for thorough understanding.
              </p>
            </div>
            <Link
              href="/how-it-works"
              className="text-xs font-semibold text-accent hover:underline hidden sm:inline-flex items-center gap-1"
            >
              Read full delivery details &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/projects"
              className="group p-5 rounded-md border border-rule bg-surface hover:border-ink hover:bg-paper transition-all space-y-2 block"
            >
              <div className="text-xs uppercase tracking-wider font-semibold text-accent">Deliverable 1</div>
              <div className="font-semibold text-ink text-base group-hover:text-accent transition-colors">
                Source code
              </div>
              <p className="text-sm text-ink-2 leading-relaxed">
                The full project as a zip file with clean architecture, comments and a setup README.
              </p>
              <span className="inline-flex text-xs font-semibold text-accent group-hover:underline pt-2">
                Browse project codebases &rarr;
              </span>
            </Link>

            <Link
              href="/projects"
              className="group p-5 rounded-md border border-rule bg-surface hover:border-ink hover:bg-paper transition-all space-y-2 block"
            >
              <div className="text-xs uppercase tracking-wider font-semibold text-accent">Deliverable 2</div>
              <div className="font-semibold text-ink text-base group-hover:text-accent transition-colors">
                Setup guide
              </div>
              <p className="text-sm text-ink-2 leading-relaxed">
                Step-by-step instructions to run the project on your own computer without confusion.
              </p>
              <span className="inline-flex text-xs font-semibold text-accent group-hover:underline pt-2">
                See setup instructions &rarr;
              </span>
            </Link>

            <Link
              href="/projects"
              className="group p-5 rounded-md border border-rule bg-surface hover:border-ink hover:bg-paper transition-all space-y-2 block"
            >
              <div className="text-xs uppercase tracking-wider font-semibold text-accent">Deliverable 3</div>
              <div className="font-semibold text-ink text-base group-hover:text-accent transition-colors">
                Report template
              </div>
              <p className="text-sm text-ink-2 leading-relaxed">
                A chapter outline with notes on what each chapter should cover. You write the report in your own words.
              </p>
              <span className="inline-flex text-xs font-semibold text-accent group-hover:underline pt-2">
                Explore kit documentation &rarr;
              </span>
            </Link>

            <Link
              href="/projects"
              className="group p-5 rounded-md border border-rule bg-surface hover:border-ink hover:bg-paper transition-all space-y-2 block"
            >
              <div className="text-xs uppercase tracking-wider font-semibold text-accent">Deliverable 4</div>
              <div className="font-semibold text-ink text-base group-hover:text-accent transition-colors">
                Presentation template
              </div>
              <p className="text-sm text-ink-2 leading-relaxed">
                A slide outline for your project presentation before your internal project guide.
              </p>
              <span className="inline-flex text-xs font-semibold text-accent group-hover:underline pt-2">
                View presentation slides &rarr;
              </span>
            </Link>

            <Link
              href="/projects"
              className="group p-5 rounded-md border border-rule bg-surface hover:border-ink hover:bg-paper transition-all space-y-2 block"
            >
              <div className="text-xs uppercase tracking-wider font-semibold text-accent">Deliverable 5</div>
              <div className="font-semibold text-ink text-base group-hover:text-accent transition-colors">
                Viva questions
              </div>
              <p className="text-sm text-ink-2 leading-relaxed">
                Questions your evaluators may ask, with explanations, so that you understand your project.
              </p>
              <span className="inline-flex text-xs font-semibold text-accent group-hover:underline pt-2">
                Practise viva preparation &rarr;
              </span>
            </Link>

            <Link
              href="/how-it-works"
              className="group p-5 rounded-md border border-dashed border-rule-strong bg-surface hover:border-ink hover:bg-paper transition-all space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider font-semibold text-accent">Walkthrough</div>
                <div className="font-semibold text-ink text-base group-hover:text-accent transition-colors">
                  How delivery works
                </div>
                <p className="text-sm text-ink-2 leading-relaxed">
                  Understand how orders, UPI verification, manual file releases and download grants work.
                </p>
              </div>
              <span className="inline-flex text-xs font-semibold text-accent group-hover:underline pt-2">
                Read delivery guide &rarr;
              </span>
            </Link>
          </div>
        </section>

        {/* Find projects for your branch and semester */}
        <section className="space-y-6 border-t border-rule pt-12">
          <div>
            <h2 className="text-2xl font-serif font-bold text-ink">
              Find projects for your branch and semester
            </h2>
            <p className="text-sm text-ink-2 mt-1">
              Select your department or course type to filter all matching project kits immediately.
            </p>
          </div>

          {/* By Branch */}
          <div className="space-y-2">
            <span className="text-xs uppercase font-semibold text-ink-3 tracking-wider">
              Engineering Branches
            </span>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/projects?branch=computer_science"
                className="px-3.5 py-1.5 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-ink hover:bg-paper hover:text-accent transition-all"
              >
                Computer Science (CSE)
              </Link>
              <Link
                href="/projects?branch=information_science"
                className="px-3.5 py-1.5 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-ink hover:bg-paper hover:text-accent transition-all"
              >
                Information Science (ISE)
              </Link>
              <Link
                href="/projects?branch=electronics_communication"
                className="px-3.5 py-1.5 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-ink hover:bg-paper hover:text-accent transition-all"
              >
                Electronics & Communication (ECE)
              </Link>
              <Link
                href="/projects?branch=mechanical"
                className="px-3.5 py-1.5 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-ink hover:bg-paper hover:text-accent transition-all"
              >
                Mechanical Engineering (ME)
              </Link>
              <Link
                href="/projects?branch=civil"
                className="px-3.5 py-1.5 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-ink hover:bg-paper hover:text-accent transition-all"
              >
                Civil Engineering (CV)
              </Link>
            </div>
          </div>

          {/* By Type & Semester */}
          <div className="space-y-2">
            <span className="text-xs uppercase font-semibold text-ink-3 tracking-wider">
              Course Types & Semesters
            </span>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/projects?type=mini_project"
                className="px-3.5 py-1.5 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-ink hover:bg-paper hover:text-accent transition-all"
              >
                Mini project
              </Link>
              <Link
                href="/projects?type=project_phase_1"
                className="px-3.5 py-1.5 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-ink hover:bg-paper hover:text-accent transition-all"
              >
                Project Phase I (7th Sem)
              </Link>
              <Link
                href="/projects?type=major_project_phase_2"
                className="px-3.5 py-1.5 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-ink hover:bg-paper hover:text-accent transition-all"
              >
                Major Project Phase II (8th Sem)
              </Link>
              <Link
                href="/projects?type=capstone"
                className="px-3.5 py-1.5 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-ink hover:bg-paper hover:text-accent transition-all"
              >
                Capstone Project
              </Link>
              <Link
                href="/projects?semester=5"
                className="px-3.5 py-1.5 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-ink hover:bg-paper hover:text-accent transition-all"
              >
                Semester 5
              </Link>
              <Link
                href="/projects?semester=6"
                className="px-3.5 py-1.5 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-ink hover:bg-paper hover:text-accent transition-all"
              >
                Semester 6
              </Link>
              <Link
                href="/projects?semester=7"
                className="px-3.5 py-1.5 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-ink hover:bg-paper hover:text-accent transition-all"
              >
                Semester 7
              </Link>
              <Link
                href="/projects?semester=8"
                className="px-3.5 py-1.5 rounded-md border border-rule bg-surface text-sm font-medium text-ink hover:border-ink hover:bg-paper hover:text-accent transition-all"
              >
                Semester 8
              </Link>
            </div>
          </div>

          <p className="text-xs text-ink-3">
            Course names and semesters differ by scheme and branch. Check your college&apos;s scheme document.
          </p>
        </section>

        {/* How we work */}
        <section className="space-y-4 border-t border-rule pt-12">
          <h2 className="text-2xl font-serif font-bold text-ink">
            How we work
          </h2>
          <div className="p-6 rounded-md border border-rule bg-surface space-y-3 max-w-3xl">
            <p className="text-sm text-ink-2 leading-relaxed">
              Kits are for learning, reference and guided customisation. You must follow your college department and VTU academic rules, and you must understand every component of your project to defend it in your viva voce. We do not take exam work, lab records or copied work.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold pt-1">
              <Link href="/academic-integrity" className="text-accent hover:underline inline-flex items-center gap-1">
                Academic integrity policy &rarr;
              </Link>
              <Link href="/how-it-works" className="text-accent hover:underline inline-flex items-center gap-1">
                How ordering works &rarr;
              </Link>
              <Link href="/refund" className="text-accent hover:underline inline-flex items-center gap-1">
                Refund guidelines &rarr;
              </Link>
              <Link href="/contact" className="text-accent hover:underline inline-flex items-center gap-1">
                Contact support &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Questions (accessible disclosure list, no animation) */}
        <section className="space-y-6 border-t border-rule pt-12">
          <div>
            <h2 className="text-2xl font-serif font-bold text-ink">
              Frequently asked questions
            </h2>
            <p className="text-sm text-ink-2 mt-1">
              Common questions from VTU students about kits, custom requests, and payment verification.
            </p>
          </div>

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
                <div className="mt-3 text-sm text-ink-2 leading-relaxed pt-2 border-t border-rule-subtle">
                  {item.answerJsx}
                </div>
              </details>
            ))}
          </div>

          <div className="pt-2 text-xs text-ink-3">
            Have a question not listed here?{" "}
            <Link href="/contact" className="text-accent underline font-medium">
              Contact our student support team
            </Link>{" "}
            or check our{" "}
            <Link href="/how-it-works" className="text-accent underline font-medium">
              complete how it works guide
            </Link>
            .
          </div>
        </section>
      </div>
    </>
  );
}
