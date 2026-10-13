import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLiveProjects } from "@/server/projects/catalogue";
import { ProjectCard } from "@/components/catalogue/project-card";
import { COURSE_TYPES, type CourseType } from "@/types/database";

interface TypeLandingProps {
  params: Promise<{ slug: string }>;
}

const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  mini_project: "Mini Project",
  project_phase_1: "Project Phase I",
  major_project_phase_2: "Major Project Phase II",
  capstone: "Capstone Project",
  hackathon_project: "Hackathon Project",
  other: "Other Project",
};

export async function generateMetadata({
  params,
}: TypeLandingProps): Promise<Metadata> {
  const { slug } = await params;
  if (!COURSE_TYPES.includes(slug as CourseType)) {
    return { title: "Type Not Found | VTU Adda Projects" };
  }

  const courseType = slug as CourseType;
  const label = COURSE_TYPE_LABELS[courseType];

  const { totalCount } = await getLiveProjects({
    type: courseType,
    sort: "newest",
    page: 1,
  });

  return {
    title: `${label} Kits | VTU Adda`,
    description: `Verified ${label} kits aligned with VTU academic milestones and project evaluation criteria.`,
    robots: {
      index: totalCount > 0 ? false : false, // Keep noindex until Prompt 11
      follow: false,
    },
  };
}

export default async function TypeLandingPage({ params }: TypeLandingProps) {
  const { slug } = await params;

  if (!COURSE_TYPES.includes(slug as CourseType)) {
    notFound();
  }

  const courseType = slug as CourseType;
  const label = COURSE_TYPE_LABELS[courseType];

  const { projects, totalCount } = await getLiveProjects({
    type: courseType,
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
        <span className="text-ink font-medium">{label}</span>
      </nav>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {label} Kits
        </h1>
        <p className="text-sm text-ink-2 max-w-3xl leading-relaxed">
          Verified {label} kits aligned with VTU academic milestones and project evaluation criteria. Includes complete source code, setup guide, report templates, and viva questions.
        </p>
      </div>

      <div className="text-sm font-medium text-ink pb-4 border-b border-rule">
        {totalCount} {totalCount === 1 ? "project" : "projects"} available
      </div>

      {projects.length === 0 ? (
        <div className="rounded-md border border-dashed border-rule p-12 text-center bg-paper space-y-3">
          <p className="text-base text-ink font-medium">
            No projects are listed yet for {label}. You can request a project, or check again soon.
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
