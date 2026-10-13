"use server";

import crypto from "node:crypto";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { createAdminClient } from "@/server/supabase/admin";
import { rateLimit } from "@/server/security/rate-limit";
import { logAdminAction } from "@/server/audit";
import { detectProjectFileSignature } from "@/server/storage/file-signatures";
import { PROJECT_FILE_KINDS, type ProjectFileKind } from "@/types/database";

const MAX_PROJECT_FILE_SIZE = 200 * 1024 * 1024; // 200 MB
const MAX_SHA256_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const KIND_ALLOWED_EXTENSIONS: Record<ProjectFileKind, string[]> = {
  code: [".zip"],
  report: [".pdf", ".docx"],
  ppt: [".pptx"],
  setup_guide: [".pdf", ".docx"],
  viva_qa: [".pdf", ".docx"],
  other: [".zip", ".pdf", ".txt", ".md"],
};

export async function createUploadUrl(params: {
  projectId: string;
  kind: ProjectFileKind;
  fileName: string;
  size: number;
  contentType: string;
}): Promise<{
  success: boolean;
  signedUrl?: string;
  token?: string;
  path?: string;
  message?: string;
}> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, message: "Rate limit exceeded. Please wait a minute." };
  }

  const { projectId, kind, fileName, size } = params;

  if (!PROJECT_FILE_KINDS.includes(kind)) {
    return { success: false, message: "Invalid project file kind." };
  }

  if (size <= 0 || size > MAX_PROJECT_FILE_SIZE) {
    return { success: false, message: "File size must be between 1 byte and 200 MB." };
  }

  const ext = path.extname(fileName).toLowerCase();
  const allowedExts = KIND_ALLOWED_EXTENSIONS[kind];
  if (!allowedExts.includes(ext)) {
    return {
      success: false,
      message: `Invalid file extension "${ext}" for ${kind}. Allowed extensions: ${allowedExts.join(", ")}`,
    };
  }

  // Safe random path: never use client-supplied file names in storage paths
  const randomFileName = `${crypto.randomUUID()}${ext}`;
  const storagePath = `projects/${projectId}/${randomFileName}`;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.storage
    .from("project-files")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return { success: false, message: `Could not create signed upload URL: ${error?.message}` };
  }

  return {
    success: true,
    signedUrl: data.signedUrl,
    token: data.token,
    path: storagePath,
  };
}

export async function finalizeUpload(params: {
  projectId: string;
  kind: ProjectFileKind;
  storagePath: string;
  originalName: string;
}): Promise<{ success: boolean; message?: string }> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, message: "Rate limit exceeded." };
  }

  const { projectId, kind, storagePath, originalName } = params;
  const adminClient = createAdminClient();

  // Sanitize original file name for display only
  const cleanOriginalName = path
    .basename(originalName)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 200);

  // Download the stored object to inspect size and magic signature
  const { data: blob, error: downloadError } = await adminClient.storage
    .from("project-files")
    .download(storagePath);

  if (downloadError || !blob) {
    return {
      success: false,
      message: "Uploaded file could not be verified in storage. Please try again.",
    };
  }

  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const actualSize = buffer.length;

  if (actualSize <= 0 || actualSize > MAX_PROJECT_FILE_SIZE) {
    await adminClient.storage.from("project-files").remove([storagePath]);
    return { success: false, message: "File size exceeds the 200 MB maximum limit." };
  }

  // Magic bytes signature verification
  const detectedSignature = detectProjectFileSignature(buffer);
  const ext = path.extname(cleanOriginalName).toLowerCase();

  let isSignatureValid = false;
  if (ext === ".pdf" && detectedSignature === "pdf") {
    isSignatureValid = true;
  } else if ((ext === ".zip" || ext === ".docx" || ext === ".pptx") && detectedSignature === "zip") {
    isSignatureValid = true;
  } else if ((ext === ".txt" || ext === ".md") && detectedSignature === "text") {
    isSignatureValid = true;
  }

  if (!isSignatureValid) {
    // Reject and delete object immediately
    await adminClient.storage.from("project-files").remove([storagePath]);
    return {
      success: false,
      message: `File content does not match extension "${ext}". Real file signature check failed.`,
    };
  }

  // Compute SHA256 only for files up to 25 MB
  let sha256: string | null = null;
  if (actualSize <= MAX_SHA256_FILE_SIZE) {
    sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  }

  // Check for existing file of this kind (version replacement)
  const { data: existingFile } = await adminClient
    .from("project_files")
    .select("id, version, storage_path")
    .eq("project_id", projectId)
    .eq("kind", kind)
    .maybeSingle();

  const nextVersion = existingFile ? existingFile.version + 1 : 1;

  const { data: fileRow, error: dbError } = await adminClient
    .from("project_files")
    .upsert(
      {
        id: existingFile ? existingFile.id : crypto.randomUUID(),
        project_id: projectId,
        kind,
        storage_path: storagePath,
        original_name: cleanOriginalName,
        size_bytes: actualSize,
        content_type: blob.type || "application/octet-stream",
        sha256,
        version: nextVersion,
      },
      { onConflict: "storage_path" }
    )
    .select()
    .single();

  if (dbError) {
    await adminClient.storage.from("project-files").remove([storagePath]);
    return { success: false, message: `Database error: ${dbError.message}` };
  }

  // If replacing an existing file, clean up old storage object
  if (existingFile && existingFile.storage_path !== storagePath) {
    await adminClient.storage.from("project-files").remove([existingFile.storage_path]);
  }

  await logAdminAction({
    actorId: authUser.user.id,
    action: existingFile ? "replace_project_file" : "upload_project_file",
    entity: "project_files",
    entityId: fileRow.id,
    details: {
      projectId,
      kind,
      version: nextVersion,
      sizeBytes: actualSize,
      originalName: cleanOriginalName,
    },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

export async function deleteProjectFile(
  projectId: string,
  fileId: string
): Promise<{ success: boolean; message?: string }> {
  const authUser = await requireAdmin();

  const rate = await rateLimit(`admin_action_${authUser.user.id}`, 60, 60);
  if (!rate.allowed) {
    return { success: false, message: "Rate limit exceeded." };
  }

  const adminClient = createAdminClient();

  const { data: file } = await adminClient
    .from("project_files")
    .select("id, storage_path, original_name, kind")
    .eq("id", fileId)
    .eq("project_id", projectId)
    .single();

  if (!file) {
    return { success: false, message: "File not found." };
  }

  await Promise.all([
    adminClient.from("project_files").delete().eq("id", fileId),
    adminClient.storage.from("project-files").remove([file.storage_path]),
  ]);

  await logAdminAction({
    actorId: authUser.user.id,
    action: "delete_project_file",
    entity: "project_files",
    entityId: fileId,
    details: { projectId, kind: file.kind, originalName: file.original_name },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}
