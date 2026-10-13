import "server-only";

import { createAdminClient } from "@/server/supabase/admin";
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

function memoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
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

/**
 * Checks whether an action key is within the allowed request rate.
 * Uses atomic Postgres function rate_limit_hit in production, keeping in-memory for tests.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  // Use memory store for unit tests or if explicitly test env
  if (process.env.NODE_ENV === "test") {
    return memoryRateLimit(key, limit, windowSeconds);
  }

  try {
    const admin = createAdminClient();
    const { data: isHit, error } = await admin.rpc("rate_limit_hit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      // In development, fallback to memory if migrations are not yet applied
      if (process.env.NODE_ENV === "development") {
        return memoryRateLimit(key, limit, windowSeconds);
      }
      throw new AppError(
        "Rate limit verification failed",
        "RATE_LIMIT_ERROR",
        500
      );
    }

    const allowed = !isHit;
    const now = Date.now();
    const resetAt = now + windowSeconds * 1000;

    return {
      allowed,
      remaining: allowed ? 1 : 0,
      resetAt,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (process.env.NODE_ENV === "development") {
      return memoryRateLimit(key, limit, windowSeconds);
    }
    throw new AppError(
      "Rate limit service unavailable",
      "RATE_LIMIT_UNAVAILABLE",
      500
    );
  }
}

export function resetRateLimitStoreForTesting(): void {
  memoryStore.clear();
}
