"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { rateLimit } from "@/server/security/rate-limit";
import { logAdminAction } from "@/server/audit";
import { evaluateProjectReadiness } from "@/server/projects/readiness";
import { extractYouTubeVideoId } from "@/lib/youtube";
import {
  COURSE_TYPES,
  DIFFICULTIES,
  type Project,
  type ProjectFile,
  type ProjectMedia,
} from "@/types/database";

const projectFormSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric characters with hyphens"),
  summary: z.string().trim().min(10, "Summary must be at least 10 characters").max(300),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  course_type: z.enum(COURSE_TYPES),
  difficulty: z.enum(DIFFICULTIES),
  tech_stack: z
    .string()
    .transform((val) =>
      val
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12)
    ),
  price_inr: z.coerce.number().int().min(0, "Price must be 0 or greater"),
  sales_limit: z.coerce
    .number()
    .int()
    .positive("Sales limit must be a positive integer")
    .nullable()
    .optional(),
  syllabus_note: z.string().trim().optional(),
  demo_video_url: z
    .string()
    .trim()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return Boolean(extractYouTubeVideoId(val));
    }, "Demo video URL must be a valid YouTube link (youtube.com or youtu.be)"),
});

export type ProjectActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  projectId?: string;
};

export async function createProject(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { status: "error", message: "Rate limit exceeded. Please wait a minute." };
  }

  const rawSalesLimit = formData.get("sales_limit");
  const parse = projectFormSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    course_type: formData.get("course_type"),
    difficulty: formData.get("difficulty"),
    tech_stack: formData.get("tech_stack"),
    price_inr: formData.get("price_inr"),
    sales_limit: rawSalesLimit ? Number(rawSalesLimit) : null,
    syllabus_note: formData.get("syllabus_note") || undefined,
    demo_video_url: formData.get("demo_video_url") || undefined,
  });

  if (!parse.success) {
    return { status: "error", message: parse.error.issues[0]?.message || "Validation failed" };
  }

  const {
    title,
    slug,
    summary,
    description,
    course_type,
    difficulty,
    tech_stack,
    price_inr,
    sales_limit,
    syllabus_note,
    demo_video_url,
  } = parse.data;

  const adminClient = createAdminClient();

  // Check unique slug
  const { data: existingSlug } = await adminClient
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingSlug) {
    return { status: "error", message: `The slug "${slug}" is already in use by another project.` };
  }

  const { data: newProj, error } = await adminClient
    .from("projects")
    .insert({
      title,
      slug,
      summary,
      description,
      course_type,
      difficulty,
      tech_stack,
      price_inr,
      sales_limit: sales_limit || null,
      syllabus_note: syllabus_note || null,
      demo_video_url: demo_video_url || null,
      status: "draft",
    })
    .select()
    .single();

  if (error || !newProj) {
    return { status: "error", message: `Database error: ${error?.message}` };
  }

  // Handle category selections
  const categoryIds = formData.getAll("category_ids").map((id) => id.toString());
  if (categoryIds.length > 0) {
    const pcRows = categoryIds.map((cid) => ({
      project_id: newProj.id,
      category_id: cid,
    }));
    await adminClient.from("project_categories").insert(pcRows);
  }

  await logAdminAction({
    actorId: authUser.user.id,
    action: "create_project",
    entity: "projects",
    entityId: newProj.id,
    details: { title, slug, price_inr },
  });

  redirect(`/admin/projects/${newProj.id}`);
}

export async function updateProject(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { status: "error", message: "Rate limit exceeded. Please wait a minute." };
  }

  const projectId = formData.get("projectId") as string;
  if (!projectId || !z.string().uuid().safeParse(projectId).success) {
    return { status: "error", message: "Invalid project ID." };
  }

  const rawSalesLimit = formData.get("sales_limit");
  const parse = projectFormSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    course_type: formData.get("course_type"),
    difficulty: formData.get("difficulty"),
    tech_stack: formData.get("tech_stack"),
    price_inr: formData.get("price_inr"),
    sales_limit: rawSalesLimit ? Number(rawSalesLimit) : null,
    syllabus_note: formData.get("syllabus_note") || undefined,
    demo_video_url: formData.get("demo_video_url") || undefined,
  });

  if (!parse.success) {
    return { status: "error", message: parse.error.issues[0]?.message || "Validation failed" };
  }

  const {
    title,
    slug,
    summary,
    description,
    course_type,
    difficulty,
    tech_stack,
    price_inr,
    sales_limit,
    syllabus_note,
    demo_video_url,
  } = parse.data;

  const adminClient = createAdminClient();

  // Check unique slug on other projects
  const { data: existingSlug } = await adminClient
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .neq("id", projectId)
    .maybeSingle();

  if (existingSlug) {
    return { status: "error", message: `The slug "${slug}" is already in use by another project.` };
  }

  const { error } = await adminClient
    .from("projects")
    .update({
      title,
      slug,
      summary,
      description,
      course_type,
      difficulty,
      tech_stack,
      price_inr,
      sales_limit: sales_limit || null,
      syllabus_note: syllabus_note || null,
      demo_video_url: demo_video_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    return { status: "error", message: `Failed to update project: ${error.message}` };
  }

  // Sync categories
  const categoryIds = formData.getAll("category_ids").map((id) => id.toString());
  await adminClient.from("project_categories").delete().eq("project_id", projectId);
  if (categoryIds.length > 0) {
    const pcRows = categoryIds.map((cid) => ({
      project_id: projectId,
      category_id: cid,
    }));
    await adminClient.from("project_categories").insert(pcRows);
  }

  await logAdminAction({
    actorId: authUser.user.id,
    action: "update_project",
    entity: "projects",
    entityId: projectId,
    details: { title, slug, price_inr },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { status: "success", message: "Project updated successfully." };
}

export async function publishProject(
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, message: "Rate limit exceeded." };
  }

  const adminClient = createAdminClient();

  const [projRes, filesRes, mediaRes] = await Promise.all([
    adminClient.from("projects").select("*").eq("id", projectId).single(),
    adminClient.from("project_files").select("*").eq("project_id", projectId),
    adminClient.from("project_media").select("*").eq("project_id", projectId),
  ]);

  if (!projRes.data) {
    return { success: false, message: "Project not found." };
  }

  const project = projRes.data as Project;
  const files = (filesRes.data || []) as ProjectFile[];
  const media = (mediaRes.data || []) as ProjectMedia[];

  // Go-live verification
  const readiness = evaluateProjectReadiness(project, files, media);
  if (!readiness.canPublish) {
    return {
      success: false,
      message: `Cannot publish: ${readiness.missingRequired.join("; ")}`,
    };
  }

  const now = new Date().toISOString();
  const { error } = await adminClient
    .from("projects")
    .update({
      status: "live",
      published_at: project.published_at || now,
      updated_at: now,
    })
    .eq("id", projectId);

  if (error) {
    return { success: false, message: error.message };
  }

  await logAdminAction({
    actorId: authUser.user.id,
    action: "publish_project",
    entity: "projects",
    entityId: projectId,
    details: { title: project.title },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  return { success: true };
}

export async function unpublishProject(
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, message: "Rate limit exceeded." };
  }

  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await adminClient
    .from("projects")
    .update({ status: "hidden", updated_at: now })
    .eq("id", projectId);

  if (error) {
    return { success: false, message: error.message };
  }

  await logAdminAction({
    actorId: authUser.user.id,
    action: "unpublish_project",
    entity: "projects",
    entityId: projectId,
  });

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  return { success: true };
}

export async function resetSalesWindow(
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, message: "Rate limit exceeded." };
  }

  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await adminClient
    .from("projects")
    .update({ sales_window_start: now, updated_at: now })
    .eq("id", projectId);

  if (error) {
    return { success: false, message: error.message };
  }

  await logAdminAction({
    actorId: authUser.user.id,
    action: "reset_sales_window",
    entity: "projects",
    entityId: projectId,
    details: { sales_window_start: now },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

export async function deleteProject(
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, message: "Rate limit exceeded." };
  }

  const adminClient = createAdminClient();

  // Check if any order references this project
  const { count } = await adminClient
    .from("order_items")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (count && count > 0) {
    return {
      success: false,
      message:
        "This project is referenced by past orders and cannot be deleted. You can set its status to Hidden instead.",
    };
  }

  // Delete project (cascade removes project_categories, project_files, project_media in Postgres)
  const { error } = await adminClient.from("projects").delete().eq("id", projectId);
  if (error) {
    return { success: false, message: error.message };
  }

  await logAdminAction({
    actorId: authUser.user.id,
    action: "delete_project",
    entity: "projects",
    entityId: projectId,
  });

  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}
