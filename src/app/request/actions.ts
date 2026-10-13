"use server";

import { createRequestAction, type UploadedReferenceFile } from "@/server/requests/service";
import type { CourseType } from "@/types/database";

export interface SubmitRequestState {
  success?: boolean;
  requestId?: string;
  error?: string;
}

export async function submitCustomRequestForm(
  prevState: SubmitRequestState | null,
  formData: FormData
): Promise<SubmitRequestState> {
  try {
    const title = (formData.get("title") as string) || "";
    const brief = (formData.get("brief") as string) || "";
    const branch = (formData.get("branch") as string) || "";
    const semesterStr = formData.get("semester") as string;
    const scheme = (formData.get("scheme") as string) || "";
    const courseType = formData.get("course_type") as CourseType;
    const techPref = (formData.get("tech_pref") as string) || null;
    const deadline = (formData.get("deadline") as string) || "";
    const budgetStr = formData.get("budget_inr") as string;
    const teamSizeStr = formData.get("team_size") as string;
    const ackIntegrity = formData.get("ack_integrity") === "on" || formData.get("ack_integrity") === "true";

    const semester = parseInt(semesterStr, 10);
    const teamSize = parseInt(teamSizeStr, 10) || 1;
    const budgetInr = budgetStr ? parseInt(budgetStr, 10) : null;

    // Extract reference files from FormData
    const uploadedFiles: UploadedReferenceFile[] = [];
    const files = formData.getAll("reference_files") as File[];

    for (const f of files) {
      if (f && f.size > 0 && f.name) {
        const arrayBuf = await f.arrayBuffer();
        uploadedFiles.push({
          name: f.name,
          size: f.size,
          buffer: Buffer.from(arrayBuf),
        });
      }
    }

    const result = await createRequestAction(
      {
        title,
        brief,
        branch,
        semester,
        scheme,
        course_type: courseType,
        tech_pref: techPref,
        deadline,
        budget_inr: budgetInr,
        team_size: teamSize,
        ack_integrity: ackIntegrity,
      },
      uploadedFiles
    );

    return {
      success: true,
      requestId: result.requestId,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to submit project request",
    };
  }
}
