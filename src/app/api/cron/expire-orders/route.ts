import { verifyCronAuthorization, expireOverdueOrders } from "@/server/orders/expiry";
import { sendSessionReminders } from "@/server/mentoring/reminders";

export async function GET(request: Request) {
  if (!verifyCronAuthorization(request)) {
    return new Response(null, { status: 401 });
  }

  const result = await expireOverdueOrders();
  try {
    await sendSessionReminders();
  } catch {
    // Non-blocking
  }
  return Response.json(result);
}
