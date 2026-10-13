"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import {
  submitOrderPaymentProof,
  submitPaymentProofInputSchema,
} from "@/server/orders/service";

export interface PaymentActionState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitPaymentProofAction(
  _prevState: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const authUser = await requireUser();

  const orderId = String(formData.get("orderId") || "");
  const utr = String(formData.get("utr") || "").trim();
  const paidVia = formData.get("paidVia") ? String(formData.get("paidVia")).trim() : null;

  const parse = submitPaymentProofInputSchema.safeParse({
    orderId,
    utr,
    paidVia,
  });

  if (!parse.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parse.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      status: "error",
      message: parse.error.issues[0]?.message || "Validation failed",
      fieldErrors,
    };
  }

  // Handle optional screenshot file
  const screenshotFile = formData.get("screenshot") as File | null;
  let screenshotBuffer: Buffer | null = null;

  if (screenshotFile && screenshotFile.size > 0) {
    if (screenshotFile.size > 3 * 1024 * 1024) {
      return {
        status: "error",
        message: "Payment screenshot must be 3 MB or less.",
        fieldErrors: { screenshot: "File exceeds 3 MB limit." },
      };
    }
    const arrayBuffer = await screenshotFile.arrayBuffer();
    screenshotBuffer = Buffer.from(arrayBuffer);
  }

  const result = await submitOrderPaymentProof({
    userId: authUser.user.id,
    userEmail: authUser.user.email || "",
    orderId: parse.data.orderId,
    utr: parse.data.utr,
    screenshotBuffer,
  });

  if (!result.success) {
    return {
      status: "error",
      message: result.errorMessage || "Could not submit payment details.",
    };
  }

  // Transition succeeded; redirect to order status timeline
  redirect(`/account/orders/${orderId}`);
}
