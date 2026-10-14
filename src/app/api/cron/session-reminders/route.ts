import { verifyCronAuthorization } from "@/server/orders/expiry";
import { sendSessionReminders } from "@/server/mentoring/reminders";

export async function GET(request: Request) {
  if (!verifyCronAuthorization(request)) {
    return new Response(null, { status: 401 });
  }

  const result = await sendSessionReminders();
  return Response.json(result);
}
