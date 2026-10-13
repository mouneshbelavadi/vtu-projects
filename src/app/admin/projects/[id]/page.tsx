import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { env } from "@/server/env";
import { evaluateProjectReadiness } from "@/server/projects/readiness";
import { ProjectReadinessCard } from "./project-readiness-card";
import { ProjectSalesWindowCard } from "./project-sales-window-card";
import { ProjectEditForm } from "./project-edit-form";
import { ProjectScreenshotsManager } from "./project-screenshots-manager";
import { ProjectFilesManager } from "./project-files-manager";
import type {
  Project,
  ProjectFile,
  ProjectMedia,
  Category,
} from "@/types/database";

interface ProjectDetailsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Project Kit Details | Admin",
};

export default async function AdminProjectDetailsPage({
  params,
}: ProjectDetailsPageProps) {
  await requireAdmin();

  const { id } = await params;
  const adminClient = createAdminClient();

  const [
    projectRes,
    categoriesRes,
    projectCategoriesRes,
    filesRes,
    mediaRes,
  ] = await Promise.all([
    adminClient.from("projects").select("*").eq("id", id).maybeSingle(),
    adminClient.from("categories").select("*").order("kind").order("sort_order"),
    adminClient.from("project_categories").select("category_id").eq("project_id", id),
    adminClient
      .from("project_files")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    adminClient
      .from("project_media")
      .select("*")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (!projectRes.data) {
    notFound();
  }

  const project = projectRes.data as Project;
  const categories = (categoriesRes.data || []) as Category[];
  const selectedCategoryIds = (projectCategoriesRes.data || []).map(
    (pc: { category_id: string }) => pc.category_id
  );
  const files = (filesRes.data || []) as ProjectFile[];
  const media = (mediaRes.data || []) as ProjectMedia[];

  // Count orders in current sales window (paid, pending_verification, or awaiting_payment)
  const { count: orderItemsCount } = await adminClient
    .from("order_items")
    .select("id, orders!inner(status, created_at)", { count: "exact", head: true })
    .eq("project_id", id)
    .gte("orders.created_at", project.sales_window_start)
    .in("orders.status", ["paid", "pending_verification", "awaiting_payment"]);

  const salesCount = orderItemsCount ?? 0;
  const readiness = evaluateProjectReadiness(project, files, media);

  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-8">
      {/* Header & Breadcrumb */}
      <div className="space-y-2">
        <Link
          href="/admin/projects"
          className="text-xs font-medium text-ink-2 hover:text-ink transition-colors flex items-center gap-1"
        >
          &larr; Back to all project kits
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-ink">
              {project.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-2">
              <span className="font-mono">slug: {project.slug}</span>
              <span>&bull;</span>
              <span>Created {formatDate(project.created_at)} IST</span>
              <span>&bull;</span>
              <span>Updated {formatDate(project.updated_at)} IST</span>
            </div>
          </div>
        </div>
      </div>

      {/* Go-Live Readiness Checklist */}
      <ProjectReadinessCard project={project} readiness={readiness} />

      {/* Sales Limit & Window */}
      <ProjectSalesWindowCard project={project} salesCount={salesCount} />

      {/* Project Deliverable Files */}
      <ProjectFilesManager project={project} files={files} />

      {/* Project Screenshots */}
      <ProjectScreenshotsManager
        project={project}
        media={media}
        supabaseUrl={env.NEXT_PUBLIC_SUPABASE_URL}
      />

      {/* Project Details Form */}
      <ProjectEditForm
        project={project}
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
      />
    </div>
  );
}
