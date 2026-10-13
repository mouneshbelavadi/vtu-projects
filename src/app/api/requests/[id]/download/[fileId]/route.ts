import { getUserOrNull } from "@/server/auth";
import { consumeCustomRequestDownloadAndSignUrl } from "@/server/requests/downloads";
import { AppError } from "@/server/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const authUser = await getUserOrNull();
  if (!authUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Same-origin verification
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return new Response("Cross-origin request refused", { status: 403 });
      }
    } catch {
      return new Response("Invalid request origin", { status: 400 });
    }
  } else if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return new Response("Cross-origin request refused", { status: 403 });
      }
    } catch {
      return new Response("Invalid request referer", { status: 400 });
    }
  }

  const { id: requestId, fileId } = await params;
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  try {
    const { signedUrl } = await consumeCustomRequestDownloadAndSignUrl({
      requestId,
      fileId,
      userId: authUser.user.id,
      clientIp,
      isAdmin: authUser.roles.includes("admin"),
    });

    return new Response(null, {
      status: 303,
      headers: {
        Location: signedUrl,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return new Response(err.message, { status: err.statusCode });
    }
    return new Response("Download request failed", { status: 500 });
  }
}

export async function GET() {
  return new Response("Method Not Allowed. Downloads must use POST.", {
    status: 405,
    headers: {
      Allow: "POST",
      "Cache-Control": "no-store",
    },
  });
}
