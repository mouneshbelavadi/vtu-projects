import "server-only";

// NOTE: In-memory rate limiter store used only when NODE_ENV is development or test.
// In production, this module will throw an AppError until the Postgres-backed atomic rate limiter
// is implemented in Prompt 3.

import { AppError } from "../errors";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Checks whether an action key is within the allowed request rate.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    throw new AppError(
      "Postgres rate limiter is not yet configured for production mode. Scheduled for Prompt 3.",
      "RATE_LIMIT_UNCONFIGURED",
      500
    );
  }

  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowSeconds * 1000;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt,
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

export function resetRateLimitStoreForTesting(): void {
  memoryStore.clear();
}
