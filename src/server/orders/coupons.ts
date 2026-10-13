import "server-only";
import { createAdminClient } from "@/server/supabase/admin";

export interface CouponValidationResult {
  valid: boolean;
  couponId?: string;
  discountInr: number;
  finalTotalInr: number;
  errorMessage?: string;
}

export async function validateAndApplyCoupon(
  code: string | null | undefined,
  subtotalInr: number
): Promise<CouponValidationResult> {
  if (!code || !code.trim()) {
    return {
      valid: true,
      discountInr: 0,
      finalTotalInr: Math.max(1, subtotalInr),
    };
  }

  const trimmedCode = code.trim();
  const adminClient = createAdminClient();

  const { data: coupon, error } = await adminClient
    .from("coupons")
    .select("id, code, percent_off, amount_off_inr, max_redemptions, redeemed_count, valid_from, valid_to, active")
    .ilike("code", trimmedCode)
    .maybeSingle();

  if (error || !coupon) {
    return {
      valid: false,
      discountInr: 0,
      finalTotalInr: subtotalInr,
      errorMessage: "Coupon code is invalid.",
    };
  }

  if (!coupon.active) {
    return {
      valid: false,
      discountInr: 0,
      finalTotalInr: subtotalInr,
      errorMessage: "Coupon is no longer active.",
    };
  }

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return {
      valid: false,
      discountInr: 0,
      finalTotalInr: subtotalInr,
      errorMessage: "Coupon is not yet valid.",
    };
  }

  if (coupon.valid_to && new Date(coupon.valid_to) < now) {
    return {
      valid: false,
      discountInr: 0,
      finalTotalInr: subtotalInr,
      errorMessage: "Coupon has expired.",
    };
  }

  if (
    coupon.max_redemptions !== null &&
    coupon.redeemed_count >= coupon.max_redemptions
  ) {
    return {
      valid: false,
      discountInr: 0,
      finalTotalInr: subtotalInr,
      errorMessage: "Coupon usage limit has been reached.",
    };
  }

  let calculatedDiscount = 0;
  if (coupon.percent_off) {
    // Percentage discount is rounded down to whole rupees
    calculatedDiscount = Math.floor((subtotalInr * coupon.percent_off) / 100);
  } else if (coupon.amount_off_inr) {
    calculatedDiscount = coupon.amount_off_inr;
  }

  // Total after discount must stay at least 1 rupee
  const maxAllowedDiscount = Math.max(0, subtotalInr - 1);
  const discountInr = Math.min(calculatedDiscount, maxAllowedDiscount);
  const finalTotalInr = Math.max(1, subtotalInr - discountInr);

  return {
    valid: true,
    couponId: coupon.id,
    discountInr,
    finalTotalInr,
  };
}
