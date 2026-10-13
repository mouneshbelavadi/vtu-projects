import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { publicEnv } from "@/lib/public-env";
import { siteConfig } from "../../../../../../site.config";
import { KitDetailView } from "@/components/catalogue/kit-detail-view";
import type {
  Project,
  ProjectMedia,
  ProjectFileSummary,
  Category,
} from "@/types/database";

interface AdminProjectPreviewProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Draft Preview | Admin",
};

export default async function AdminProjectPreviewPage({
  params,
}: AdminProjectPreviewProps) {
  await requireAdmin();

  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: projectRes } = await adminClient
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!projectRes) {
    notFound();
  }

  const project = projectRes as Project;

  const [categoriesRes, mediaRes, filesRes] = await Promise.all([
    adminClient
      .from("project_categories")
      .select("category:categories(*)")
      .eq("project_id", project.id),
    adminClient
      .from("project_media")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true }),
    adminClient
      .from("project_files")
      .select("id, project_id, kind, original_name, size_bytes")
      .eq("project_id", project.id),
  ]);

  const categories = (categoriesRes.data || [])
    .map((pc: any) => pc.category)
    .filter(Boolean) as Category[];

  const media = (mediaRes.data || []) as ProjectMedia[];
  const fileSummaries = (filesRes.data || []) as ProjectFileSummary[];

  const pageUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/projects/${project.slug}`;

  return (
    <KitDetailView
      project={project}
      categories={categories}
      media={media}
      fileSummaries={fileSummaries}
      reviews={[]}
      relatedProjects={[]}
      isLimitReached={false}
      pageUrl={pageUrl}
      whatsappNumber={siteConfig.whatsappNumber || "919876543210"}
      supabaseUrl={publicEnv.NEXT_PUBLIC_SUPABASE_URL || ""}
      previewBanner="Draft preview. Not visible to the public."
    />
  );
}
