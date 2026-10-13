import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLiveProjects } from "@/server/projects/catalogue";
import { ProjectCard } from "@/components/catalogue/project-card";

interface SemesterLandingProps {
  params: Promise<{ number: string }>;
}

function getOrdinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

export async function generateMetadata({
  params,
}: SemesterLandingProps): Promise<Metadata> {
  const { number } = await params;
  const semNum = Number.parseInt(number, 10);
  if (Number.isNaN(semNum) || semNum < 1 || semNum > 8) {
    return { title: "Semester Not Found | VTU Adda Projects" };
  }

  const ordinal = getOrdinal(semNum);
  const { totalCount } = await getLiveProjects({
    semester: `sem-${semNum}`,
    sort: "newest",
    page: 1,
  });

  return {
    title: `${ordinal} Semester Projects | VTU Adda`,
    description: `Curated project kits suitable for ${ordinal} semester VTU engineering coursework.`,
    robots: {
      index: totalCount > 0 ? false : false, // Keep noindex until Prompt 11
      follow: false,
    },
  };
}

export default async function SemesterLandingPage({
  params,
}: SemesterLandingProps) {
  const { number } = await params;
  const semNum = Number.parseInt(number, 10);

  if (Number.isNaN(semNum) || semNum < 1 || semNum > 8) {
    notFound();
  }

  const ordinal = getOrdinal(semNum);
  const { projects, totalCount } = await getLiveProjects({
    semester: `sem-${semNum}`,
    sort: "newest",
    page: 1,
  });

  return (
    <div className="mx-auto max-w-container px-4 py-8 sm:px-6 sm:py-12 space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-ink-2 flex items-center gap-1.5">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-ink">
          Projects
        </Link>
        <span>/</span>
        <span className="text-ink font-medium">{ordinal} Semester</span>
      </nav>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {ordinal} Semester Project Kits
        </h1>
        <p className="text-sm text-ink-2 max-w-3xl leading-relaxed">
          Curated project kits suitable for {ordinal} semester VTU engineering coursework. Each kit contains working source code, setup guide, report templates, and viva questions.
        </p>
      </div>

      <div className="text-sm font-medium text-ink pb-4 border-b border-rule">
        {totalCount} {totalCount === 1 ? "project" : "projects"} available
      </div>

      {projects.length === 0 ? (
        <div className="rounded-md border border-dashed border-rule p-12 text-center bg-paper space-y-3">
          <p className="text-base text-ink font-medium">
            No projects are listed yet for {ordinal} semester. You can request a project, or check again soon.
          </p>
          <p>
            <Link href="/projects" className="text-sm font-semibold text-accent hover:underline">
              Browse all project kits
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
