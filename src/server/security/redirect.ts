// Validation for internal redirect paths (open redirect protection)

const ALLOWED_PATH_PREFIXES = [
  "/",
  "/account",
  "/admin",
  "/checkout",
  "/projects",
  "/request",
  "/mentoring",
  "/orders",
  "/how-it-works",
  "/contact",
  "/terms",
  "/privacy",
  "/refund",
  "/design",
] as const;

/**
 * Validates and sanitizes a redirect target path.
 * Must start with a single slash, must not start with // or contain backslashes or protocols,
 * and must match an allowlist of internal path prefixes.
 */
export function validateSafeRedirect(
  target: string | null | undefined,
  fallback = "/"
): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();
  if (!trimmed) {
    return fallback;
  }

  // Must start with exactly one slash, not double slash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  // Must not contain backslashes
  if (trimmed.includes("\\")) {
    return fallback;
  }

  // Must not contain colon (prevents protocols like http:, https:, javascript:, data:)
  if (trimmed.includes(":")) {
    return fallback;
  }

  // Check for encoded backslashes or control characters
  try {
    const decoded = decodeURIComponent(trimmed);
    if (
      decoded.includes("\\") ||
      decoded.includes(":") ||
      decoded.startsWith("//") ||
      // eslint-disable-next-line no-control-regex
      /[\u0000-\u001F\u007F]/.test(decoded)
    ) {
      return fallback;
    }

    // Extract path portion before query or hash
    const pathOnly = (decoded.split("?")[0] ?? "").split("#")[0] ?? "";

    // Must match at least one allowed prefix
    const isAllowed = ALLOWED_PATH_PREFIXES.some((prefix) => {
      if (prefix === "/") {
        return pathOnly === "/" || pathOnly === "";
      }
      return pathOnly === prefix || pathOnly.startsWith(prefix + "/");
    });

    if (!isAllowed) {
      return fallback;
    }

    return trimmed;
  } catch {
    // Decoding failed, unsafe input
    return fallback;
  }
}
