"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import { holdSlotForBooking } from "@/server/mentoring/service";

export interface BookSlotState {
  status: "idle" | "error";
  errorMessage?: string;
}

export async function bookSlotAction(
  _prevState: BookSlotState,
  formData: FormData
): Promise<BookSlotState> {
  const tierId = String(formData.get("tierId") || "");
  const authUser = await requireUser(`/mentoring/book/${tierId}`);

  const slotId = String(formData.get("slotId") || "");
  const ackIntegrity = formData.get("ack_integrity") === "true" || formData.get("ack_integrity") === "on";

  if (!slotId) {
    return {
      status: "error",
      errorMessage: "Please select an available time slot.",
    };
  }

  if (!ackIntegrity) {
    return {
      status: "error",
      errorMessage:
        "You must confirm that you will follow your college and VTU rules.",
    };
  }

  const result = await holdSlotForBooking(authUser.user.id, {
    slotId,
    tierId,
    ackIntegrity: true,
  });

  if (!result.success || !result.orderId) {
    return {
      status: "error",
      errorMessage: result.errorMessage || "Could not reserve this time slot. Please try another.",
    };
  }

  // Redirect to existing UPI checkout page
  redirect(`/checkout/${result.orderId}`);
}
