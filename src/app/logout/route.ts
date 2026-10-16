import { NextResponse } from "next/server";
import { createClient } from "@/server/supabase/server";
import { assertSameOrigin } from "@/server/security/same-origin";

export async function POST(request: Request) {
  assertSameOrigin(request);

  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL("/", request.url);
  const response = NextResponse.redirect(url, { status: 303 });
  response.cookies.delete("vtu_dev_auth");
  return response;
}

export async function GET() {
  return new NextResponse("Method Not Allowed: logout must be requested via POST", {
    status: 405,
    headers: {
      Allow: "POST",
    },
  });
}
