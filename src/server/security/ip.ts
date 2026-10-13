import "server-only";
import crypto from "node:crypto";

/**
 * Extracts client IP from incoming request headers, respecting common reverse-proxy headers.
 */
export function getClientIp(headers: Headers): string {
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp?.trim()) {
    return xRealIp.trim();
  }

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) {
    return cfConnectingIp.trim();
  }

  return "127.0.0.1";
}

/**
 * Hashes an IP address using HMAC-SHA256 with IP_HASH_SALT.
 * Never stores or returns raw IP addresses.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "development_salt_at_least_32_characters_long_1234";
  return crypto.createHmac("sha256", salt).update(ip).digest("hex");
}
