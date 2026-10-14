"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/server/auth";
import { submitVerifiedReview, moderateReview } from "./service";

export async function submitReviewAction(formData: {
  orderId: string;
  projectId: string;
  rating: number;
  body: string;
}) {
  const authUser = await requireUser();

  const result = await submitVerifiedReview({
    userId: authUser.user.id,
    orderId: formData.orderId,
    projectId: formData.projectId,
    rating: formData.rating,
    body: formData.body,
  });

  if (result.success) {
    revalidatePath(`/account/orders/${formData.orderId}`);
  }

  return result;
}

export async function moderateReviewAction(
  reviewId: string,
  status: "approved" | "hidden",
  adminReason?: string | null
) {
  const admin = await requireAdmin();

  const result = await moderateReview({
    reviewId,
    status,
    adminReason,
    adminUserId: admin.user.id,
  });

  if (result.success) {
    revalidatePath("/admin/reviews");
    revalidatePath("/projects");
  }

  return result;
}
