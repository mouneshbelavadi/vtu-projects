import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, Star } from "lucide-react";
import { Price } from "@/components/ui/price";
import { publicEnv } from "@/lib/public-env";
import type { ProjectCatalogueItem } from "@/server/projects/catalogue";

interface ProjectCardProps {
  project: ProjectCatalogueItem;
}

const COURSE_TYPE_LABELS: Record<string, string> = {
  mini_project: "Mini Project",
  project_phase_1: "Phase I (7th Sem)",
  major_project_phase_2: "Major Project (8th Sem)",
  capstone: "Capstone",
  hackathon_project: "Hackathon",
  other: "Other",
};

export function ProjectCard({ project }: ProjectCardProps) {
  const branchNames = project.categories
    .filter((c) => c.kind === "branch")
    .map((c) => (c.name.split("(")[0] ?? c.name).trim());

  const primaryBranch = branchNames[0] || "VTU Engg";
  const semName = project.categories.find((c) => c.kind === "semester")?.name;
  const schemeName = project.categories.find((c) => c.kind === "scheme")?.name;

  const metaParts: string[] = [];
  if (project.course_type) {
    metaParts.push(COURSE_TYPE_LABELS[project.course_type] || project.course_type);
  }
  if (semName) {
    metaParts.push(semName);
  }
  if (schemeName) {
    metaParts.push(schemeName);
  }

  const coverUrl =
    project.cover_path && publicEnv.NEXT_PUBLIC_SUPABASE_URL
      ? `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${project.cover_path}`
      : null;

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-rule/80 bg-surface shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-300 overflow-hidden">
      <div>
        {/* Thumbnail Area with smooth image zoom or ambient gradient pattern */}
        <Link
          href={`/projects/${project.slug}`}
          className="relative block aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900"
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={project.cover_alt || project.title}
              width={640}
              height={360}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-slate-100 to-violet-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950">
              {/* Subtle decorative mesh grid */}
              <div
                className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px] opacity-20"
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-1.5 rounded-full border border-indigo-200/60 bg-white/80 dark:bg-slate-900/80 px-3 py-1 text-xs font-semibold text-brand-600 shadow-xs backdrop-blur-xs">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span>Verified Project Kit</span>
              </div>
            </div>
          )}

          {/* Floating Branch Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center rounded-full border border-white/60 bg-white/90 dark:bg-slate-900/90 dark:border-slate-700 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 dark:text-slate-100 shadow-xs backdrop-blur-md">
              {primaryBranch}
            </span>
          </div>

          {/* Review badge if present */}
          {project.review_stats.count > 0 && project.review_stats.average !== null && (
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-white/95 dark:bg-slate-900/95 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 shadow-xs backdrop-blur-md">
                <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                <span>{project.review_stats.average}</span>
              </span>
            </div>
          )}
        </Link>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          {metaParts.length > 0 && (
            <div className="text-[11px] font-semibold tracking-wider text-ink-3 uppercase">
              {metaParts.join(" • ")}
            </div>
          )}

          <h2 className="font-display text-base font-bold text-ink leading-snug group-hover:text-accent transition-colors line-clamp-2">
            <Link href={`/projects/${project.slug}`}>
              {project.title}
            </Link>
          </h2>

          <p className="text-xs text-ink-2 line-clamp-2 leading-relaxed">
            {project.summary}
          </p>

          {/* Tech Stack Chips */}
          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {project.tech_stack.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Price & Action */}
      <div className="flex items-center justify-between p-5 pt-3.5 border-t border-rule/70 bg-slate-50/50 dark:bg-slate-900/40">
        <div>
          <span className="block text-[10px] font-semibold text-ink-3 uppercase tracking-wider">Complete Kit</span>
          <Price amountInr={project.price_inr} className="text-base font-extrabold text-ink" />
        </div>

        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200/80 bg-brand-50/80 dark:bg-brand-950/60 dark:border-brand-800 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300 shadow-xs transition-all duration-200 group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 group-hover:shadow-sm"
        >
          <span>View kit</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

/**
 * Skeleton loading card matching the ProjectCard layout.
 */
export function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-rule/80 bg-surface shadow-xs overflow-hidden animate-pulse">
      <div>
        <div className="aspect-video w-full bg-slate-200 dark:bg-slate-800" />
        <div className="p-5 space-y-3">
          <div className="h-3 w-1/3 rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-4/5 rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-2/3 rounded-md bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="flex gap-1.5 pt-1">
            <div className="h-5 w-12 rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-14 rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-10 rounded-md bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between p-5 pt-3.5 border-t border-rule/70 bg-slate-50/50">
        <div className="h-5 w-16 rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-8 w-20 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
