import Link from "next/link";
import Image from "next/image";
import { Price } from "@/components/ui/price";
import { publicEnv } from "@/lib/public-env";
import type { ProjectCatalogueItem } from "@/server/projects/catalogue";

interface ProjectCardProps {
  project: ProjectCatalogueItem;
}

const COURSE_TYPE_LABELS: Record<string, string> = {
  mini_project: "Mini Project",
  project_phase_1: "Project Phase I",
  major_project_phase_2: "Major Project Phase II",
  capstone: "Capstone",
  hackathon_project: "Hackathon",
  other: "Other",
};

export function ProjectCard({ project }: ProjectCardProps) {
  const branchNames = project.categories
    .filter((c) => c.kind === "branch")
    .map((c) => (c.name.split("(")[0] ?? c.name).trim());

  const semName = project.categories.find((c) => c.kind === "semester")?.name;
  const schemeName = project.categories.find((c) => c.kind === "scheme")?.name;

  const metaParts: string[] = [];
  if (project.course_type) {
    metaParts.push(COURSE_TYPE_LABELS[project.course_type] || project.course_type);
  }
  if (branchNames.length > 0) {
    metaParts.push(branchNames.slice(0, 2).join(", "));
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
    <article className="group flex flex-col justify-between rounded-md border border-rule bg-surface transition-colors duration-120 hover:border-rule-strong overflow-hidden">
      <div>
        {/* Cover image or labelled block */}
        <Link href={`/projects/${project.slug}`} className="block relative aspect-video bg-paper overflow-hidden">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={project.cover_alt || project.title}
              width={640}
              height={360}
              className="object-cover w-full h-full transition-transform duration-120 group-hover:scale-[1.01]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-paper text-ink-3 text-xs uppercase tracking-wider font-semibold">
              Project kit preview
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="p-4 space-y-2">
          {metaParts.length > 0 && (
            <div className="text-[11px] font-medium text-ink-2 uppercase tracking-wider line-clamp-1">
              {metaParts.join(" • ")}
            </div>
          )}

          <h2 className="font-serif text-base font-bold text-ink leading-snug group-hover:text-accent transition-colors">
            <Link href={`/projects/${project.slug}`}>
              {project.title}
            </Link>
          </h2>

          <p className="text-xs text-ink-2 line-clamp-2 leading-relaxed">
            {project.summary}
          </p>

          {/* Tech tags */}
          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {project.tech_stack.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="rounded-xs bg-paper border border-rule px-1.5 py-0.5 text-[10px] text-ink font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Price and real rating */}
      <div className="flex items-center justify-between p-4 pt-3 border-t border-rule bg-paper/50">
        <div>
          {project.review_stats.count > 0 && project.review_stats.average !== null ? (
            <div className="text-xs text-ink-2 flex items-center gap-1 font-medium">
              <span className="text-accent font-bold">{project.review_stats.average}/5</span>
              <span className="text-ink-3">({project.review_stats.count})</span>
            </div>
          ) : (
            <span className="text-xs text-ink-3">Verified Kit</span>
          )}
        </div>

        <Price amountInr={project.price_inr} className="text-base font-bold text-ink" />
      </div>
    </article>
  );
}
