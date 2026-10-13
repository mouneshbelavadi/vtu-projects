"use server";

import { z } from "zod";
import crypto from "node:crypto";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { rateLimit } from "@/server/security/rate-limit";
import { logAdminAction } from "@/server/audit";
import { detectImageSignature } from "@/server/storage/file-signatures";

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

export type ScreenshotActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function uploadScreenshot(
  _prevState: ScreenshotActionState,
  formData: FormData
): Promise<ScreenshotActionState> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { status: "error", message: "Rate limit exceeded. Please wait a minute." };
  }

  const projectId = formData.get("projectId") as string;
  const altText = (formData.get("altText") as string || "").trim();
  const file = formData.get("file") as File | null;

  if (!projectId || !z.string().uuid().safeParse(projectId).success) {
    return { status: "error", message: "Invalid project ID." };
  }

  if (!altText || altText.length > 300) {
    return { status: "error", message: "Alt text is required (up to 300 characters)." };
  }

  if (!file || file.size === 0) {
    return { status: "error", message: "Please select an image file to upload." };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { status: "error", message: "Image size exceeds 4 MB limit." };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Magic bytes check (accepts png, jpeg, webp only; refuses SVG, GIF, HTML, etc.)
  const detectedFormat = detectImageSignature(buffer);
  if (!detectedFormat) {
    return {
      status: "error",
      message:
        "Refused: Invalid image file. Only real PNG, JPEG, and WebP files are accepted. SVG and GIF files are refused.",
    };
  }

  // Process with sharp: max width 1600px, re-encode to WebP, metadata stripped
  let processedBuffer: Buffer;
  try {
    processedBuffer = await sharp(buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    return {
      status: "error",
      message: "Image processing failed. File may be corrupted.",
    };
  }

  const adminClient = createAdminClient();

  // Verify project exists
  const { data: project } = await adminClient
    .from("projects")
    .select("id, cover_path")
    .eq("id", projectId)
    .single();

  if (!project) {
    return { status: "error", message: "Project not found." };
  }

  const objectPath = `projects/${projectId}/${crypto.randomUUID()}.webp`;

  const { error: uploadError } = await adminClient.storage
    .from("public-media")
    .upload(objectPath, processedBuffer, {
      contentType: "image/webp",
      upsert: false,
    });

  if (uploadError) {
    return { status: "error", message: `Storage upload failed: ${uploadError.message}` };
  }

  // Get current max sort_order
  const { data: existingMedia } = await adminClient
    .from("project_media")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existingMedia?.[0]?.sort_order ?? 0) + 1;

  const { data: mediaRow, error: insertError } = await adminClient
    .from("project_media")
    .insert({
      project_id: projectId,
      storage_path: objectPath,
      alt_text: altText,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (insertError) {
    // Clean up uploaded object if database insert fails
    await adminClient.storage.from("public-media").remove([objectPath]);
    return { status: "error", message: `Database error: ${insertError.message}` };
  }

  // First screenshot becomes the cover
  if (!project.cover_path || nextOrder === 1) {
    await adminClient
      .from("projects")
      .update({ cover_path: objectPath, updated_at: new Date().toISOString() })
      .eq("id", projectId);
  }

  await logAdminAction({
    actorId: authUser.user.id,
    action: "upload_screenshot",
    entity: "project_media",
    entityId: mediaRow.id,
    details: { projectId, storagePath: objectPath, altText },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { status: "success", message: "Screenshot uploaded and converted to WebP." };
}

export async function deleteScreenshot(
  projectId: string,
  mediaId: string
): Promise<{ success: boolean; message?: string }> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, message: "Rate limit exceeded." };
  }

  const adminClient = createAdminClient();

  const { data: media } = await adminClient
    .from("project_media")
    .select("id, storage_path, sort_order")
    .eq("id", mediaId)
    .eq("project_id", projectId)
    .single();

  if (!media) {
    return { success: false, message: "Screenshot not found." };
  }

  await Promise.all([
    adminClient.from("project_media").delete().eq("id", mediaId),
    adminClient.storage.from("public-media").remove([media.storage_path]),
  ]);

  // Update cover_path to the next remaining first screenshot
  const { data: remaining } = await adminClient
    .from("project_media")
    .select("storage_path")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .limit(1);

  const newCover = remaining?.[0]?.storage_path || null;
  await adminClient
    .from("projects")
    .update({ cover_path: newCover, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  await logAdminAction({
    actorId: authUser.user.id,
    action: "delete_screenshot",
    entity: "project_media",
    entityId: mediaId,
    details: { projectId, storagePath: media.storage_path },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

export async function reorderScreenshot(
  projectId: string,
  mediaId: string,
  direction: "up" | "down"
): Promise<{ success: boolean; message?: string }> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, message: "Rate limit exceeded." };
  }

  const adminClient = createAdminClient();

  const { data: current } = await adminClient
    .from("project_media")
    .select("id, sort_order")
    .eq("id", mediaId)
    .eq("project_id", projectId)
    .single();

  if (!current) {
    return { success: false, message: "Screenshot not found." };
  }

  let query = adminClient
    .from("project_media")
    .select("id, sort_order")
    .eq("project_id", projectId);

  query =
    direction === "up"
      ? query.lt("sort_order", current.sort_order).order("sort_order", { ascending: false })
      : query.gt("sort_order", current.sort_order).order("sort_order", { ascending: true });

  const { data: neighbor } = await query.limit(1).maybeSingle();

  if (!neighbor) {
    return { success: true };
  }

  await Promise.all([
    adminClient.from("project_media").update({ sort_order: neighbor.sort_order }).eq("id", current.id),
    adminClient.from("project_media").update({ sort_order: current.sort_order }).eq("id", neighbor.id),
  ]);

  // Update cover_path to whatever is now first
  const { data: firstMedia } = await adminClient
    .from("project_media")
    .select("storage_path")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .limit(1);

  if (firstMedia?.[0]?.storage_path) {
    await adminClient
      .from("projects")
      .update({ cover_path: firstMedia[0].storage_path, updated_at: new Date().toISOString() })
      .eq("id", projectId);
  }

  await logAdminAction({
    actorId: authUser.user.id,
    action: "reorder_screenshot",
    entity: "project_media",
    entityId: mediaId,
    details: { projectId, direction },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}
