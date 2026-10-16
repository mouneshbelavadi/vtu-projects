import { verifyCronAuthorization, expireOverdueOrders } from "@/server/orders/expiry";

export async function GET(request: Request) {
  if (!verifyCronAuthorization(request)) {
    return new Response(null, { status: 401 });
  }

  const result = await expireOverdueOrders();
  return Response.json(result);
}
