import type { MetadataRoute } from "next";
import { createAdminClient } from "@/server/supabase/admin";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://projects.vtuadda.com";

  // Static public pages
  const staticRoutes = [
    "",
    "/projects",
    "/mentoring",
    "/request",
    "/how-it-works",
    "/contact",
    "/academic-integrity",
    "/refund",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  try {
    const adminClient = createAdminClient();
    const { data: projects, error } = await adminClient
      .from("projects")
      .select("slug, updated_at, branch, semester, course_type")
      .eq("status", "live");

    if (error || !projects) {
      return staticRoutes;
    }

    // 1. Live kit URLs
    const projectRoutes = projects.map((project) => ({
      url: `${baseUrl}/projects/${project.slug}`,
      lastModified: project.updated_at ? new Date(project.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // 2. Filter landing pages with real results
    const branches = Array.from(
      new Set(projects.map((p) => p.branch).filter(Boolean))
    );
    const branchRoutes = branches.map((branch) => ({
      url: `${baseUrl}/projects/branch/${encodeURIComponent(branch.toLowerCase())}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const semesters = Array.from(
      new Set(projects.map((p) => p.semester).filter(Boolean))
    );
    const semesterRoutes = semesters.map((sem) => ({
      url: `${baseUrl}/projects/semester/${encodeURIComponent(String(sem))}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const types = Array.from(
      new Set(projects.map((p) => p.course_type).filter(Boolean))
    );
    const typeRoutes = types.map((type) => ({
      url: `${baseUrl}/projects/type/${encodeURIComponent(type.toLowerCase())}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [
      ...staticRoutes,
      ...projectRoutes,
      ...branchRoutes,
      ...semesterRoutes,
      ...typeRoutes,
    ];
  } catch {
    return staticRoutes;
  }
}
