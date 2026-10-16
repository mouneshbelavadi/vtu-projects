import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { ProjectCard } from "@/components/catalogue/project-card";
import { getLiveProjects, type ProjectCatalogueItem } from "@/server/projects/catalogue";
import { siteConfig } from "../../site.config";
import { HeroSearch } from "@/components/home/hero-search";
import { RequirementMatcher } from "@/components/home/requirement-matcher";

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

const DOMAINS = [
  {
    name: "AI & Machine Learning",
    kits: "18+ Kits",
    query: "machine learning",
    tag: "Popular",
    description: "Deep learning, classification, CNNs, NLP and computer vision systems",
  },
  {
    name: "Web Development",
    kits: "24+ Kits",
    query: "web",
    tag: "High Demand",
    description: "Full stack platforms, React, Next.js, Node.js and REST API architectures",
  },
  {
    name: "IoT & Embedded Systems",
    kits: "16+ Kits",
    query: "iot",
    tag: "Hardware",
    description: "ESP32, Arduino, MQTT telemetry, sensor networks and live dashboards",
  },
  {
    name: "Data Science & Analytics",
    kits: "14+ Kits",
    query: "data",
    tag: "Analytics",
    description: "Pandas, statistical prediction, data visualization and automated pipelines",
  },
  {
    name: "Cybersecurity & Cryptography",
    kits: "12+ Kits",
    query: "security",
    tag: "Security",
    description: "Intrusion detection, AES encryption, biometric auth and packet analyzers",
  },
  {
    name: "Cloud & Distributed Systems",
    kits: "11+ Kits",
    query: "cloud",
    tag: "Cloud",
    description: "Microservices, serverless storage, containerization and scaling",
  },
  {
    name: "Blockchain & Web3",
    kits: "8+ Kits",
    query: "blockchain",
    tag: "Decentralized",
    description: "Smart contracts, decentralized voting, verifiable ledger audit trails",
  },
  {
    name: "Mobile App Development",
    kits: "15+ Kits",
    query: "mobile",
    tag: "Android/iOS",
    description: "Flutter, React Native, cross-platform apps with Firebase and Supabase",
  },
  {
    name: "Robotics & Automation",
    kits: "9+ Kits",
    query: "robotics",
    tag: "Mechanical/EC",
    description: "Autonomous pathfinding, motor control systems and computer vision bots",
  },
  {
    name: "Database Management Systems",
    kits: "10+ Kits",
    query: "database",
    tag: "Core",
    description: "Relational modeling, transaction management, indexing and ACID guarantees",
  },
];

const STUDENT_FEEDBACK = [
  {
    name: "Sanjay K.",
    branch: "Computer Science (CSE)",
    college: "BMSCE, Bengaluru",
    text: "The viva question bank and explanation notes helped me explain the OpenCV image processing pipeline during our external exam without hesitation.",
  },
  {
    name: "Pooja M.",
    branch: "Information Science (ISE)",
    college: "DSCE, Bengaluru",
    text: "The setup instructions worked on Ubuntu out of the box. Saved our project group days of tricky dependency troubleshooting before our internal guide review.",
  },
  {
    name: "Karthik R.",
    branch: "Electronics & Communication (ECE)",
    college: "RNSIT, Bengaluru",
    text: "Clean report template matching VTU formatting guidelines. We were able to organize our sensor observations and complete the report in our own words.",
  },
];

export default async function HomePage() {
  let featuredProjects: ProjectCatalogueItem[] = [];
  try {
    const result = await getLiveProjects({ sort: "newest", page: 1 });
    featuredProjects = (result.projects || []).slice(0, 4);
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

      <div className="mx-auto max-w-container px-4 py-8 sm:px-6 sm:py-12 space-y-16">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-rule bg-surface text-xs font-medium text-ink-2">
              <span className="font-semibold text-accent">VTU 2022 & 2018 Schemes</span>
              <span className="text-rule-strong">•</span>
              <span>CSE, ISE, ECE, ME & Civil</span>
            </div>

            <div className="space-y-3">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl leading-tight">
                Build. Submit. Graduate.
              </h1>
              <p className="text-base text-ink-2 leading-relaxed sm:text-lg">
                Ready-to-run engineering project kits with source code, report templates, PPT presentations, and viva questions. Verified by hand before file release.
              </p>
            </div>

            {/* Interactive Search Bar */}
            <HeroSearch />

            {/* Hero Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <LinkButton href="/projects" variant="primary">
                Browse all project kits &rarr;
              </LinkButton>
              <LinkButton href="/request" variant="secondary">
                Request custom project
              </LinkButton>
              <Link
                href="/how-it-works"
                className="text-sm font-semibold text-accent hover:underline px-2 py-2 inline-flex items-center gap-1"
              >
                How it works &rarr;
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Featured Preview Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Link
              href="/projects?q=attendance"
              className="p-4 rounded-md border border-rule bg-surface hover:border-ink hover:bg-paper transition-all cursor-pointer space-y-2 block"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="px-1.5 py-0.5 rounded-xs bg-accent-weak text-accent font-semibold">
                  Computer Vision
                </span>
                <span className="text-ink font-semibold">₹3,499</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-ink leading-snug hover:text-accent">
                AI Attendance System
              </h3>
              <p className="text-xs text-ink-2 leading-relaxed line-clamp-2">
                Face recognition with OpenCV, SQLite records and automated report generator.
              </p>
              <div className="text-[11px] font-semibold text-accent pt-1 flex items-center justify-between">
                <span>View kit</span>
                <span>&rarr;</span>
              </div>
            </Link>

            <Link
              href="/projects?q=voting"
              className="p-4 rounded-md border border-rule bg-surface hover:border-ink hover:bg-paper transition-all cursor-pointer space-y-2 block"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="px-1.5 py-0.5 rounded-xs bg-accent-weak text-accent font-semibold">
                  Web3 & Security
                </span>
                <span className="text-ink font-semibold">₹3,999</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-ink leading-snug hover:text-accent">
                Blockchain Voting System
              </h3>
              <p className="text-xs text-ink-2 leading-relaxed line-clamp-2">
                Decentralized Ethereum ballots, tamper-evident audit ledger and React portal.
              </p>
              <div className="text-[11px] font-semibold text-accent pt-1 flex items-center justify-between">
                <span>View kit</span>
                <span>&rarr;</span>
              </div>
            </Link>

            <Link
              href="/projects?q=iot"
              className="p-4 rounded-md border border-rule bg-surface hover:border-ink hover:bg-paper transition-all cursor-pointer space-y-2 block"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="px-1.5 py-0.5 rounded-xs bg-warn-bg text-warn-text font-semibold">
                  IoT & Embedded
                </span>
                <span className="text-ink font-semibold">₹4,299</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-ink leading-snug hover:text-accent">
                Smart Campus IoT Monitor
              </h3>
              <p className="text-xs text-ink-2 leading-relaxed line-clamp-2">
                ESP32 telemetry sensors, MQTT broker communication and real-time dashboard.
              </p>
              <div className="text-[11px] font-semibold text-accent pt-1 flex items-center justify-between">
                <span>View kit</span>
                <span>&rarr;</span>
              </div>
            </Link>

            <Link
              href="/projects?q=cloud"
              className="p-4 rounded-md border border-rule bg-surface hover:border-ink hover:bg-paper transition-all cursor-pointer space-y-2 block"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="px-1.5 py-0.5 rounded-xs bg-accent-weak text-accent font-semibold">
                  Cloud Systems
                </span>
                <span className="text-ink font-semibold">₹2,999</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-ink leading-snug hover:text-accent">
                Cloud File Vault
              </h3>
              <p className="text-xs text-ink-2 leading-relaxed line-clamp-2">
                AES-256 encrypted file storage, role permissions and timed access links.
              </p>
              <div className="text-[11px] font-semibold text-accent pt-1 flex items-center justify-between">
                <span>View kit</span>
                <span>&rarr;</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Live Metrics Counter Bar */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-rule py-6">
          <div className="p-4 rounded-md border border-rule bg-surface text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-ink">140+</div>
            <div className="text-xs font-semibold text-ink-2">Live Project Kits</div>
            <div className="text-[11px] text-ink-3">Verified codebases and templates</div>
          </div>
          <div className="p-4 rounded-md border border-rule bg-surface text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-ink">2,500+</div>
            <div className="text-xs font-semibold text-ink-2">Engineering Students</div>
            <div className="text-[11px] text-ink-3">Across 28+ VTU institutions</div>
          </div>
          <div className="p-4 rounded-md border border-rule bg-surface text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-accent">Manual UPI</div>
            <div className="text-xs font-semibold text-ink-2">Direct Bank Verification</div>
            <div className="text-[11px] text-ink-3">No gateway convenience fees</div>
          </div>
          <div className="p-4 rounded-md border border-rule bg-surface text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-ink">4.8 / 5</div>
            <div className="text-xs font-semibold text-ink-2">Student Satisfaction</div>
            <div className="text-[11px] text-ink-3">Verified post-viva feedback</div>
          </div>
        </section>

        {/* Featured project packages (from database or curated) */}
        {featuredProjects.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <h2 className="text-2xl font-serif font-bold text-ink">
                  Featured Project Packages
                </h2>
                <p className="text-sm text-ink-2 mt-1">
                  Popular ready-to-run kits complete with source code, report documents, slides and viva prep.
                </p>
              </div>
              <Link
                href="/projects"
                className="text-sm font-semibold text-accent hover:underline hidden sm:inline-flex items-center gap-1"
              >
                View all project kits &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            <div className="sm:hidden text-center pt-2">
              <LinkButton href="/projects" variant="secondary" className="w-full">
                View all project kits &rarr;
              </LinkButton>
            </div>
          </section>
        )}

        {/* Browse by Domain Section (Interactive Grid) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-serif font-bold text-ink">
                Browse by Technical Domain
              </h2>
              <p className="text-sm text-ink-2 mt-1">
                Choose your focus technology domain to jump directly into matching project kits.
              </p>
            </div>
            <Link
              href="/projects"
              className="text-xs font-semibold text-accent hover:underline hidden sm:inline-flex items-center gap-1"
            >
              Explore all domains &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {DOMAINS.map((dom) => (
              <Link
                key={dom.name}
                href={`/projects?q=${encodeURIComponent(dom.query)}`}
                className="group p-4 rounded-md border border-rule bg-surface hover:border-ink hover:bg-paper transition-all cursor-pointer flex flex-col justify-between space-y-2 block"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="px-1.5 py-0.2 rounded-xs bg-accent-weak text-accent font-semibold">
                      {dom.tag}
                    </span>
                    <span className="text-ink-3 font-medium">{dom.kits}</span>
                  </div>
                  <h3 className="font-serif font-bold text-sm text-ink group-hover:text-accent transition-colors">
                    {dom.name}
                  </h3>
                  <p className="text-xs text-ink-2 leading-relaxed line-clamp-2">
                    {dom.description}
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-accent group-hover:underline pt-2 flex items-center justify-between">
                  <span>Explore domain</span>
                  <span>&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Interactive Requirements Matcher Widget */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-t border-rule pt-12">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-accent">
              Custom Topics & Mentoring
            </span>
            <h2 className="text-2xl font-serif font-bold text-ink leading-snug">
              Can&apos;t find your exact project topic in the catalogue?
            </h2>
            <p className="text-sm text-ink-2 leading-relaxed">
              Tell us your problem statement, semester and deadline. Our engineering team reviews the scope and either finds the closest verified codebase or prepares a custom milestone proposal.
            </p>
            <div className="space-y-2 pt-2 text-xs text-ink-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-accent text-sm">•</span>
                <span>Written scope and fixed price quote before you commit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-accent text-sm">•</span>
                <span>Milestone checkpoints where you review code modules</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-accent text-sm">•</span>
                <span>Optional 1-on-1 code walkthrough with an engineer</span>
              </div>
            </div>
            <div className="pt-2 flex flex-wrap gap-3">
              <LinkButton href="/request" variant="primary">
                Submit custom project brief
              </LinkButton>
              <LinkButton href="/mentoring" variant="secondary">
                Book mentoring session
              </LinkButton>
            </div>
          </div>

          <div className="lg:col-span-7">
            <RequirementMatcher />
          </div>
        </section>

        {/* Three Ways to Get Help (Clickable Service Cards) */}
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

        {/* Deliverables in every kit */}
        <section className="space-y-6 border-t border-rule pt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-serif font-bold text-ink">
                Complete deliverables in every kit
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

        {/* Engineering Streams & Semesters Quick Filter Pills */}
        <section className="space-y-6 border-t border-rule pt-12">
          <div>
            <h2 className="text-2xl font-serif font-bold text-ink">
              Find projects for your branch and semester
            </h2>
            <p className="text-sm text-ink-2 mt-1">
              Select your department or course type to filter all matching project kits immediately.
            </p>
          </div>

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
        </section>

        {/* Student Feedback Across Colleges */}
        <section className="space-y-6 border-t border-rule pt-12">
          <div>
            <h2 className="text-2xl font-serif font-bold text-ink">
              Feedback from VTU engineering students
            </h2>
            <p className="text-sm text-ink-2 mt-1">
              Read how engineering students from various colleges use our kits for viva preparation and code understanding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STUDENT_FEEDBACK.map((fb, idx) => (
              <div
                key={idx}
                className="p-5 rounded-md border border-rule bg-surface space-y-3 flex flex-col justify-between"
              >
                <p className="text-sm text-ink-2 leading-relaxed italic">
                  &ldquo;{fb.text}&rdquo;
                </p>
                <div className="pt-3 border-t border-rule text-xs space-y-0.5">
                  <div className="font-semibold text-ink">{fb.name}</div>
                  <div className="text-ink-3">{fb.branch} • {fb.college}</div>
                </div>
              </div>
            ))}
          </div>
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
