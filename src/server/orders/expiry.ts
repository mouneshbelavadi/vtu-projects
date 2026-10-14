import "server-only";
import crypto from "node:crypto";
import { env } from "@/server/env";
import { siteConfig } from "../../../site.config";
import { createAdminClient } from "@/server/supabase/admin";
import { sendEmail } from "@/server/email";
import { logger } from "@/server/log";

/**
 * Validates the cron authorization header against CRON_SECRET using constant-time comparison.
 */
export function verifyCronAuthorization(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || env.CRON_SECRET;
  if (!authHeader || !cronSecret) {
    return false;
  }

  const expectedHeader = `Bearer ${cronSecret}`;
  const authBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expectedHeader);

  if (authBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(authBuffer, expectedBuffer);
}

/**
 * Finds all awaiting_payment orders that have passed their expires_at timestamp,
 * updates their status to expired, dispatches notifications, and returns the total expired count.
 * Never touches pending_verification orders.
 */
export async function expireOverdueOrders(): Promise<{
  expired_count: number;
  released_slots_count?: number;
}> {
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  // 1. Release overdue held slots and cancel related awaiting_payment bookings
  let releasedSlotsCount = 0;
  try {
    const { data: slotCount } = await adminClient.rpc("expire_held_slots");
    releasedSlotsCount = Number(slotCount) || 0;
  } catch (slotErr) {
    logger.warn("Failed to expire held slots during hourly job", { error: slotErr });
  }

  // 2. Find overdue awaiting_payment orders
  const { data: overdueOrders, error } = await adminClient
    .from("orders")
    .select("id, order_code, user_id, order_items(label)")
    .eq("status", "awaiting_payment")
    .lte("expires_at", now);

  if (error || !overdueOrders || overdueOrders.length === 0) {
    return { expired_count: 0, released_slots_count: releasedSlotsCount };
  }

  let expiredCount = 0;

  for (const order of overdueOrders) {
    // Transition status to expired
    const { error: updateError } = await adminClient
      .from("orders")
      .update({
        status: "expired",
        updated_at: now,
      })
      .eq("id", order.id)
      .eq("status", "awaiting_payment"); // Concurrency safety

    if (updateError) {
      logger.warn("Failed to mark order as expired", { orderId: order.id });
      continue;
    }

    expiredCount++;

    // Send order_expired_student notification
    try {
      const [userRes, profileRes] = await Promise.all([
        adminClient.auth.admin.getUserById(order.user_id),
        adminClient.from("profiles").select("display_name").eq("id", order.user_id).maybeSingle(),
      ]);

      const studentEmail = userRes.data?.user?.email;
      const studentDisplayName = profileRes.data?.display_name || "Student";
      const kitTitle = order.order_items?.[0]?.label || "Project Kit";
      const reorderUrl = `${siteConfig.siteUrl}/projects`;

      if (studentEmail) {
        await sendEmail("order_expired_student", studentEmail, {
          orderCode: order.order_code,
          kitTitle,
          studentDisplayName,
          reorderUrl,
        });
      }
    } catch {
      logger.warn("Post-expiry email dispatch failed", { orderId: order.id });
    }
  }

  return { expired_count: expiredCount, released_slots_count: releasedSlotsCount };
}
