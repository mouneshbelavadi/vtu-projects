import "server-only";
import { AppError } from "../errors";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Validates that requests with state-changing methods come from the trusted site origin.
 * Throws a 403 AppError if the Origin (or Referer) is missing or does not match NEXT_PUBLIC_SITE_URL.
 */
export function assertSameOrigin(request: Request): void {
  const method = request.method.toUpperCase();
  if (!STATE_CHANGING_METHODS.has(method)) {
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let expectedOrigin: string;

  try {
    expectedOrigin = new URL(siteUrl).origin;
  } catch {
    throw new AppError("Invalid NEXT_PUBLIC_SITE_URL configuration", "CONFIG_ERROR", 500);
  }

  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");

  let incomingOrigin: string | null = null;

  if (originHeader) {
    try {
      incomingOrigin = new URL(originHeader).origin;
    } catch {
      throw new AppError("Invalid Origin header", "CSRF_FORBIDDEN", 403);
    }
  } else if (refererHeader) {
    try {
      incomingOrigin = new URL(refererHeader).origin;
    } catch {
      throw new AppError("Invalid Referer header", "CSRF_FORBIDDEN", 403);
    }
  }

  if (!incomingOrigin || incomingOrigin !== expectedOrigin) {
    throw new AppError(
      "Cross-site request forgery protection: origin mismatch",
      "CSRF_FORBIDDEN",
      403
    );
  }
}
