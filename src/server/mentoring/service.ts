import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/server/supabase/admin";
import { rateLimit } from "@/server/security/rate-limit";
import { sendEmail } from "@/server/email";
import { siteConfig } from "../../../site.config";
import { formatISTDateTime } from "@/lib/format";
import { logger } from "@/server/log";

export const holdSlotInputSchema = z.object({
  slotId: z.string().uuid("Invalid slot ID"),
  tierId: z.string().uuid("Invalid mentoring tier ID"),
  ackIntegrity: z.literal(true, {
    errorMap: () => ({
      message:
        "You must confirm that you will follow your college and VTU rules.",
    }),
  }),
});

export interface HoldSlotResult {
  success: boolean;
  orderId?: string;
  orderCode?: string;
  bookingId?: string;
  errorMessage?: string;
}

/**
 * Atomically acquires a hold on an open mentor slot, creating an order and booking.
 * Enforces rate limits (5 bookings per user per hour), minimum notice hours, and
 * prevents double bookings through row-level locking in SQL.
 */
export async function holdSlotForBooking(
  userId: string,
  input: z.infer<typeof holdSlotInputSchema>
): Promise<HoldSlotResult> {
  // 1. Rate limit: 5 bookings per user per hour
  const rateKey = `booking_create_${userId}`;
  const rate = await rateLimit(rateKey, 5, 3600);
  if (!rate.allowed) {
    return {
      success: false,
      errorMessage:
        "Booking limit reached. Please wait before attempting to book another session.",
    };
  }

  const parse = holdSlotInputSchema.safeParse(input);
  if (!parse.success) {
    return {
      success: false,
      errorMessage: parse.error.issues[0]?.message || "Invalid booking data",
    };
  }

  const adminClient = createAdminClient();

  // 2. Call atomic hold_slot SQL function
  const { data: rpcData, error: rpcError } = await adminClient.rpc("hold_slot", {
    p_slot_id: parse.data.slotId,
    p_user_id: userId,
    p_tier_id: parse.data.tierId,
  });

  if (rpcError) {
    const errMsg = rpcError.message || "";
    if (errMsg.includes("SLOT_NOT_AVAILABLE") || errMsg.includes("SLOT_NOT_FOUND")) {
      return {
        success: false,
        errorMessage: "This time was just taken. Please choose another.",
      };
    }
    if (errMsg.includes("MIN_NOTICE_VIOLATION")) {
      return {
        success: false,
        errorMessage:
          "This slot is inside the minimum notice window or has already passed. Please choose another.",
      };
    }
    if (errMsg.includes("INVALID_TIER")) {
      return {
        success: false,
        errorMessage: "Selected mentoring tier is invalid or no longer active.",
      };
    }
    logger.warn("Unexpected hold_slot error", { error: errMsg, slotId: parse.data.slotId });
    return {
      success: false,
      errorMessage: "Could not hold this time slot. Please try again.",
    };
  }

  const result = rpcData as {
    success: boolean;
    order_id: string;
    booking_id: string;
    order_code: string;
  };

  // 3. Dispatch booking_received email notification
  try {
    const [userRes, profileRes, slotRes, tierRes] = await Promise.all([
      adminClient.auth.admin.getUserById(userId),
      adminClient.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
      adminClient.from("mentor_slots").select("starts_at").eq("id", parse.data.slotId).single(),
      adminClient.from("mentoring_tiers").select("name").eq("id", parse.data.tierId).single(),
    ]);

    const studentEmail = userRes.data?.user?.email;
    const studentDisplayName = profileRes.data?.display_name || "Student";
    const tierName = tierRes.data?.name || "Mentoring Session";
    const sessionTimeIst = slotRes.data?.starts_at
      ? formatISTDateTime(slotRes.data.starts_at)
      : "IST";
    const checkoutUrl = `${siteConfig.siteUrl}/checkout/${result.order_id}`;

    if (studentEmail) {
      await sendEmail(
        "booking_received",
        studentEmail,
        {
          studentDisplayName,
          tierName,
          sessionTimeIst,
          orderCode: result.order_code,
          checkoutUrl,
        },
        userId
      );
    }
  } catch {
    logger.warn("Post-hold email dispatch failed", { bookingId: result.booking_id });
  }

  return {
    success: true,
    orderId: result.order_id,
    orderCode: result.order_code,
    bookingId: result.booking_id,
  };
}

/**
 * Releases slots whose hold expired, cancelling associated awaiting_payment bookings.
 */
export async function expireHeldSlots(): Promise<{ released_count: number }> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc("expire_held_slots");
  if (error) {
    logger.warn("Failed to expire held slots", { error: error.message });
    return { released_count: 0 };
  }
  return { released_count: Number(data) || 0 };
}
