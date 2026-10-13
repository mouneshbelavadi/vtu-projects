import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createServerClient } from "@/server/supabase/server";
import { getLiveProjects } from "@/server/projects/catalogue";
import { ProjectCard } from "@/components/catalogue/project-card";

interface BranchLandingProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BranchLandingProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name")
    .eq("kind", "branch")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) {
    return { title: "Branch Not Found | VTU Adda Projects" };
  }

  const { totalCount } = await getLiveProjects({
    branch: slug,
    sort: "newest",
    page: 1,
  });

  return {
    title: `${category.name} Projects | VTU Adda`,
    description: `Curated engineering project kits for ${category.name} students following the VTU syllabus.`,
    robots: {
      index: totalCount > 0 ? false : false, // Keep noindex until Prompt 11
      follow: false,
    },
  };
}

export default async function BranchLandingPage({ params }: BranchLandingProps) {
  const { slug } = await params;
  const supabase = await createServerClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("kind", "branch")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) {
    notFound();
  }

  const { projects, totalCount } = await getLiveProjects({
    branch: slug,
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
        <span className="text-ink font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {category.name} Project Kits
        </h1>
        <p className="text-sm text-ink-2 max-w-3xl leading-relaxed">
          Curated engineering project kits for {category.name} students following the VTU syllabus. Includes complete source code, setup guide, report templates, and viva questions.
        </p>
      </div>

      <div className="text-sm font-medium text-ink pb-4 border-b border-rule">
        {totalCount} {totalCount === 1 ? "project" : "projects"} available
      </div>

      {projects.length === 0 ? (
        <div className="rounded-md border border-dashed border-rule p-12 text-center bg-paper space-y-3">
          <p className="text-base text-ink font-medium">
            No projects are listed yet for {category.name}. You can request a project, or check again soon.
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
