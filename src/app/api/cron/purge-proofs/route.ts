import { verifyCronAuthorization, purgeExpiredProofs } from "@/server/payments/purge";

export async function GET(request: Request) {
  if (!verifyCronAuthorization(request)) {
    return new Response(null, { status: 401 });
  }

  const result = await purgeExpiredProofs();
  return Response.json(result);
}
