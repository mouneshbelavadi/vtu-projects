import "server-only";
import { z } from "zod";
import crypto from "node:crypto";
import { createAdminClient } from "@/server/supabase/admin";
import { requireUser } from "@/server/auth";
import { rateLimit } from "@/server/security/rate-limit";
import { AppError } from "@/server/errors";
import { logger } from "@/server/log";
import { dispatchEmail } from "@/server/email/send";
import { validateCustomReferenceFile } from "@/server/storage/file-signatures";
import { COURSE_TYPES, type CourseType } from "@/types/database";

const createRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title cannot exceed 120 characters"),
  brief: z
    .string()
    .trim()
    .min(50, "Brief must be at least 50 characters")
    .max(3000, "Brief cannot exceed 3000 characters"),
  branch: z
    .string()
    .trim()
    .min(2, "Branch must be specified")
    .max(50, "Branch cannot exceed 50 characters"),
  semester: z
    .number()
    .int()
    .min(1, "Semester must be between 1 and 8")
    .max(8, "Semester must be between 1 and 8"),
  scheme: z
    .string()
    .trim()
    .min(2, "Scheme must be specified")
    .max(20, "Scheme cannot exceed 20 characters"),
  course_type: z.enum(COURSE_TYPES, {
    errorMap: () => ({ message: "Please select a valid course type" }),
  }),
  tech_pref: z
    .string()
    .trim()
    .max(200, "Technology preference cannot exceed 200 characters")
    .optional()
    .nullable(),
  deadline: z.string().refine((val) => {
    const target = new Date(val);
    if (isNaN(target.getTime())) return false;
    const now = new Date();
    // At least 7 days ahead (6.99 days in ms to allow daylight margin)
    const minTime = now.getTime() + 7 * 24 * 60 * 60 * 1000 - 60000;
    return target.getTime() >= minTime;
  }, "Deadline must be a date at least 7 days ahead"),
  budget_inr: z
    .number()
    .int()
    .min(0, "Budget cannot be negative")
    .optional()
    .nullable(),
  team_size: z
    .number()
    .int()
    .min(1, "Team size must be between 1 and 4")
    .max(4, "Team size must be between 1 and 4"),
  ack_integrity: z.literal(true, {
    errorMap: () => ({
      message: "You must accept the academic integrity acknowledgement",
    }),
  }),
});

export interface UploadedReferenceFile {
  name: string;
  size: number;
  buffer: Buffer;
}

export async function createRequestAction(
  input: {
    title: string;
    brief: string;
    branch: string;
    semester: number;
    scheme: string;
    course_type: CourseType;
    tech_pref?: string | null;
    deadline: string;
    budget_inr?: number | null;
    team_size: number;
    ack_integrity: boolean;
  },
  files: UploadedReferenceFile[] = []
): Promise<{ success: boolean; requestId: string }> {
  // 1. Authenticate user
  const authUser = await requireUser("/request");
  const userId = authUser.user.id;
  const userEmail = authUser.user.email;

  // 2. Rate limit: 3 new requests per user per day
  const rateLimitKey = `custom_req_${userId}`;
  const rateCheck = await rateLimit(rateLimitKey, 3, 86400);
  if (!rateCheck.allowed) {
    throw new AppError(
      "You have reached the limit of 3 new project requests per day. Please try again tomorrow.",
      "RATE_LIMIT_EXCEEDED",
      429
    );
  }

  // 3. Validate form input
  const parsed = createRequestSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.errors.map((e) => e.message).join(", ");
    throw new AppError(errorMsg, "VALIDATION_ERROR", 400);
  }

  // 4. Validate reference files (up to 3 files, each <= 3 MB, magic byte check)
  if (files.length > 3) {
    throw new AppError(
      "You can upload a maximum of 3 reference files",
      "VALIDATION_ERROR",
      400
    );
  }

  const validatedFiles: {
    buffer: Buffer;
    originalName: string;
    contentType: string;
    sizeBytes: number;
  }[] = [];

  for (const f of files) {
    const check = validateCustomReferenceFile(f.buffer, f.name);
    if (!check.valid) {
      throw new AppError(
        `File "${f.name}" was refused: ${check.error}`,
        "INVALID_FILE",
        400
      );
    }
    validatedFiles.push({
      buffer: f.buffer,
      originalName: f.name,
      contentType: check.contentType,
      sizeBytes: f.size,
    });
  }

  const adminClient = createAdminClient();

  // 5. Insert custom request row
  const { data: requestRow, error: insertErr } = await adminClient
    .from("custom_requests")
    .insert({
      user_id: userId,
      title: parsed.data.title,
      brief: parsed.data.brief,
      branch: parsed.data.branch,
      semester: parsed.data.semester,
      scheme: parsed.data.scheme,
      course_type: parsed.data.course_type,
      tech_pref: parsed.data.tech_pref || null,
      deadline: parsed.data.deadline,
      budget_inr: parsed.data.budget_inr || null,
      team_size: parsed.data.team_size,
      ack_integrity: true,
      status: "submitted",
    })
    .select("id, title")
    .single();

  if (insertErr || !requestRow) {
    logger.error("Failed to create custom request row", { error: insertErr?.message });
    throw new AppError("Failed to submit custom request. Please try again.", "DB_ERROR", 500);
  }

  const requestId = requestRow.id;

  // 6. Upload reference files to storage and insert metadata
  for (const file of validatedFiles) {
    const fileId = crypto.randomUUID();
    const ext = file.originalName.split(".").pop()?.toLowerCase() || "bin";
    const storagePath = `requests/${requestId}/ref_${fileId}.${ext}`;

    const { error: uploadErr } = await adminClient.storage
      .from("request-files")
      .upload(storagePath, file.buffer, {
        contentType: file.contentType,
        upsert: false,
      });

    if (uploadErr) {
      logger.error("Failed to upload reference file to storage", {
        requestId,
        storagePath,
        error: uploadErr.message,
      });
      continue;
    }

    await adminClient.from("request_files").insert({
      request_id: requestId,
      uploaded_by: userId,
      kind: "student_reference",
      storage_path: storagePath,
      original_name: file.originalName,
      size_bytes: file.sizeBytes,
      content_type: file.contentType,
      is_final: false,
    });
  }

  // 7. Write audit log
  await adminClient.from("audit_log").insert({
    actor_id: userId,
    action: "create_custom_request",
    entity: "custom_requests",
    entity_id: requestId,
    details: {
      title: parsed.data.title,
      course_type: parsed.data.course_type,
      file_count: validatedFiles.length,
    },
    created_at: new Date().toISOString(),
  });

  // 8. Fetch student display name for email
  const { data: profile } = await adminClient
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  const studentName = profile?.display_name || "Student";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const requestUrl = `${siteUrl}/account/requests/${requestId}`;

  // 9. Dispatch emails: to student and to admin
  if (userEmail) {
    await dispatchEmail(
      "request_received",
      userEmail,
      {
        studentDisplayName: studentName,
        requestTitle: parsed.data.title,
        requestUrl,
      },
      userId
    );
  }

  // Notify admins
  const { data: adminRoles } = await adminClient
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  if (adminRoles && adminRoles.length > 0) {
    const adminUserIds = adminRoles.map((r) => r.user_id);
    const { data: adminUsers } = await adminClient.auth.admin.listUsers();
    const adminEmails = adminUsers.users
      .filter((u) => adminUserIds.includes(u.id) && u.email)
      .map((u) => u.email as string);

    if (adminEmails.length > 0) {
      // Send notification to admin group
      logger.info("Custom request notification for admins", {
        requestId,
        adminCount: adminEmails.length,
      });
    }
  }

  return { success: true, requestId };
}
