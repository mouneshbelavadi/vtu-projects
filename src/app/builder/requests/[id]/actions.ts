"use server";

import { uploadDeliverableFileAction } from "@/server/requests/builder-actions";

export async function uploadBuilderFile(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const requestId = formData.get("requestId") as string;
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
      return { success: false, error: "Please select a file to upload" };
    }

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    await uploadDeliverableFileAction({
      requestId,
      name: file.name,
      size: file.size,
      buffer,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "File upload failed" };
  }
}
