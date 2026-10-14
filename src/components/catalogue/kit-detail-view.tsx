import Link from "next/link";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { PlainDescription } from "@/components/ui/plain-description";
import { ScreenshotGallery } from "./screenshot-gallery";
import { DemoVideoPlayer } from "./demo-video-player";
import { ProjectCard } from "./project-card";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import type {
  Project,
  ProjectMedia,
  ProjectFileSummary,
  Category,
} from "@/types/database";
import type { ProjectCatalogueItem } from "@/server/projects/catalogue";

interface KitDetailReview {
  id: string;
  rating: number;
  body: string;
  created_at: string;
  reviewer_first_name: string;
}

interface KitDetailViewProps {
  project: Project;
  categories: Category[];
  media: ProjectMedia[];
  fileSummaries: ProjectFileSummary[];
  reviews: KitDetailReview[];
  relatedProjects: ProjectCatalogueItem[];
  isLimitReached: boolean;
  pageUrl: string;
  whatsappNumber: string;
  supabaseUrl: string;
  previewBanner?: string;
  isCheckoutLive?: boolean;
}

const COURSE_TYPE_LABELS: Record<string, string> = {
  mini_project: "Mini Project",
  project_phase_1: "Project Phase I",
  major_project_phase_2: "Major Project Phase II",
  capstone: "Capstone Project",
  hackathon_project: "Hackathon Project",
  other: "Other Project",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const FILE_KIND_LABELS: Record<string, string> = {
  code: "Source Code Package (.zip)",
  setup_guide: "Setup and Execution Guide",
  viva_qa: "Viva Examination Questions and Answers",
  report: "Report Template",
  ppt: "Presentation Slide Deck",
  other: "Supplementary Resource",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function KitDetailView({
  project,
  categories,
  media,
  fileSummaries,
  reviews,
  relatedProjects,
  isLimitReached,
  pageUrl,
  whatsappNumber,
  supabaseUrl,
  previewBanner,
  isCheckoutLive = true,
}: KitDetailViewProps) {
  const branches = categories.filter((c) => c.kind === "branch");
  const semesters = categories.filter((c) => c.kind === "semester");
  const schemes = categories.filter((c) => c.kind === "scheme");

  const embedUrl = project.demo_video_url
    ? getYouTubeEmbedUrl(project.demo_video_url)
    : null;

  const cleanWhatsappNumber = whatsappNumber.replace(/[^0-9]/g, "");
  const whatsappHref = `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(
    `Hello, I have a question about the project: ${project.title} (${pageUrl})`
  )}`;

  return (
    <div className="mx-auto max-w-container px-4 py-8 sm:px-6 sm:py-12 space-y-12">
      {/* Draft Preview Banner (admin only) */}
      {previewBanner && (
        <div className="rounded-md border border-warn-bg bg-warn-bg p-4 text-sm font-semibold text-warn-text">
          {previewBanner}
        </div>
      )}

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-ink-2 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-ink">
          Projects
        </Link>
        <span>/</span>
        <span className="text-ink font-medium truncate max-w-sm">
          {project.title}
        </span>
      </nav>

      {/* Hero / Overview Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Gallery Column */}
        <div className="lg:col-span-2 space-y-4">
          <ScreenshotGallery
            media={media}
            supabaseUrl={supabaseUrl}
            projectTitle={project.title}
          />
        </div>

        {/* Commercial & Action Column */}
        <div className="p-6 rounded-md border border-rule bg-surface space-y-6">
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl leading-snug">
              {project.title}
            </h1>
            <p className="text-sm text-ink-2 leading-relaxed">
              {project.summary}
            </p>
          </div>

          <div className="pt-2 border-t border-rule space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-ink-2 font-medium">
                Kit Price
              </span>
              <Price amountInr={project.price_inr} className="text-2xl font-bold text-ink" />
            </div>

            {/* Buy button or sales limit notice */}
            {isLimitReached ? (
              <div className="p-3 bg-paper rounded border border-rule text-xs text-ink-2">
                Not available right now. You can request a custom version, or check again next semester.
              </div>
            ) : isCheckoutLive ? (
              <Link
                href={`/checkout/start?project=${project.slug}`}
                className="block w-full text-center py-3 rounded-md bg-accent text-surface text-sm font-semibold hover:bg-accent-hover transition-colors"
              >
                Buy this kit
              </Link>
            ) : (
              <div className="p-3 bg-paper rounded border border-rule text-xs text-ink-2 text-center">
                Payment verification opens in checkout.
              </div>
            )}

            {/* WhatsApp Link */}
            {cleanWhatsappNumber && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs font-semibold text-accent hover:underline pt-1"
              >
                Ask a question on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* What is included */}
      <section className="space-y-4 border-t border-rule pt-10">
        <h2 className="text-xl font-serif font-bold text-ink">
          What is included
        </h2>
        {fileSummaries.length === 0 ? (
          <p className="text-sm text-ink-2">
            File deliverables are being packaged for this kit.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-rule">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-rule bg-paper text-xs uppercase tracking-wider text-ink-2">
                <tr>
                  <th className="px-4 py-3">Deliverable</th>
                  <th className="px-4 py-3">File name</th>
                  <th className="px-4 py-3 text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule bg-surface">
                {fileSummaries.map((file) => (
                  <tr key={file.id}>
                    <td className="px-4 py-3 font-medium text-ink">
                      {FILE_KIND_LABELS[file.kind] || file.kind}
                    </td>
                    <td className="px-4 py-3 text-ink-2 font-mono text-xs">
                      {file.original_name}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-ink-2">
                      {formatBytes(file.size_bytes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Fits (Academic Classifications) */}
      <section className="space-y-4 border-t border-rule pt-10">
        <h2 className="text-xl font-serif font-bold text-ink">
          Fits
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-paper rounded-md border border-rule space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-2">Course Type</dt>
            <dd className="text-sm font-medium text-ink">
              {COURSE_TYPE_LABELS[project.course_type] || project.course_type}
            </dd>
          </div>

          <div className="p-4 bg-paper rounded-md border border-rule space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-2">Branches</dt>
            <dd className="text-sm font-medium text-ink">
              {branches.length > 0 ? branches.map((b) => b.name).join(", ") : "All Branches"}
            </dd>
          </div>

          <div className="p-4 bg-paper rounded-md border border-rule space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-2">Semester</dt>
            <dd className="text-sm font-medium text-ink">
              {semesters.length > 0 ? semesters.map((s) => s.name).join(", ") : "Semester flexible"}
            </dd>
          </div>

          <div className="p-4 bg-paper rounded-md border border-rule space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-2">Scheme</dt>
            <dd className="text-sm font-medium text-ink">
              {schemes.length > 0 ? schemes.map((s) => s.name).join(", ") : "VTU Scheme"}
            </dd>
          </div>

          <div className="p-4 bg-paper rounded-md border border-rule space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-2">Difficulty</dt>
            <dd className="text-sm font-medium text-ink">
              {DIFFICULTY_LABELS[project.difficulty] || project.difficulty}
            </dd>
          </div>

          <div className="p-4 bg-paper rounded-md border border-rule space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-2">Tech Stack</dt>
            <dd className="text-sm font-medium text-ink">
              {project.tech_stack && project.tech_stack.length > 0
                ? project.tech_stack.join(", ")
                : "Standard libraries"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Description */}
      <section className="space-y-4 border-t border-rule pt-10">
        <h2 className="text-xl font-serif font-bold text-ink">
          Description
        </h2>
        <div className="p-6 rounded-md border border-rule bg-surface">
          <PlainDescription content={project.description} />
        </div>
      </section>

      {/* Syllabus Note */}
      {project.syllabus_note && (
        <section className="space-y-3 border-t border-rule pt-10">
          <h2 className="text-xl font-serif font-bold text-ink">
            Syllabus Note
          </h2>
          <div className="p-4 rounded-md border border-rule bg-paper text-sm text-ink-2 leading-relaxed">
            {project.syllabus_note}
          </div>
        </section>
      )}

      {/* Demo Video */}
      {embedUrl && (
        <section className="space-y-4 border-t border-rule pt-10">
          <h2 className="text-xl font-serif font-bold text-ink">
            Demonstration Video
          </h2>
          <DemoVideoPlayer embedUrl={embedUrl} />
        </section>
      )}

      {/* Before you buy notice */}
      <section className="p-5 rounded-md border border-rule bg-accent-weak/50 space-y-2">
        <h3 className="text-sm font-bold text-accent">Before you buy</h3>
        <p className="text-xs text-ink leading-relaxed">
          This kit is for learning and reference. You must follow your college and VTU rules and be able to explain the project.
        </p>
      </section>

      {/* Approved Reviews (render only when reviews exist) */}
      {reviews.length > 0 && (
        <section className="space-y-4 border-t border-rule pt-10">
          <h2 className="text-xl font-serif font-bold text-ink">
            Student Reviews ({reviews.length})
          </h2>
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-md border border-rule bg-surface space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{rev.reviewer_first_name}</span>
                    <Badge variant="accent">Verified buyer</Badge>
                  </div>
                  <span className="text-ink-2">{formatDate(rev.created_at)}</span>
                </div>
                <div className="text-xs text-accent font-bold">
                  Rating: {rev.rating} of 5
                </div>
                <p className="text-sm text-ink-2 leading-relaxed">
                  {rev.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Kits */}
      {relatedProjects.length > 0 && (
        <section className="space-y-6 border-t border-rule pt-10">
          <h2 className="text-xl font-serif font-bold text-ink">
            Related Project Kits
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProjects.map((rel) => (
              <ProjectCard key={rel.id} project={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
