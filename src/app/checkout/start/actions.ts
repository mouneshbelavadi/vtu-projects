"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import { createKitOrder, createOrderInputSchema } from "@/server/orders/service";

export interface CreateOrderActionState {
  status: "idle" | "error";
  message?: string;
}

export async function handleCreateOrder(
  _prevState: CreateOrderActionState,
  formData: FormData
): Promise<CreateOrderActionState> {
  const authUser = await requireUser();

  const projectSlug = String(formData.get("projectSlug") || "");
  const couponCode = formData.get("couponCode") ? String(formData.get("couponCode")) : null;
  const displayName = formData.get("displayName") ? String(formData.get("displayName")) : null;
  const ackIntegrityValue = formData.get("ackIntegrity") === "on";

  const parse = createOrderInputSchema.safeParse({
    projectSlug,
    couponCode,
    displayName,
    ackIntegrity: ackIntegrityValue,
  });

  if (!parse.success) {
    return {
      status: "error",
      message:
        parse.error.issues[0]?.message ||
        "Please confirm the academic integrity checkbox to proceed.",
    };
  }

  const result = await createKitOrder(authUser.user.id, parse.data);

  if (result.isAlreadyPaid) {
    redirect("/account/orders?status=already_paid");
  }

  if (!result.success || !result.orderId) {
    return {
      status: "error",
      message:
        result.errorMessage || "Could not complete order creation. Please try again.",
    };
  }

  // Redirect to payment step
  redirect(`/checkout/${result.orderId}`);
}
