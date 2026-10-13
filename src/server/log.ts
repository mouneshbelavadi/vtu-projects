import "server-only";

const SENSITIVE_KEY_PATTERN = /(?:password|token|secret|authorization|cookie|key|email|phone)/i;

/**
 * Recursively redacts sensitive keys from log objects.
 */
export function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = redactSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

type LogLevel = "info" | "warn" | "error" | "debug";

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const safeMeta = meta ? redactSensitiveData(meta) : undefined;
  const payload = {
    timestamp,
    level,
    message,
    ...(safeMeta ? { meta: safeMeta } : {}),
  };
  return JSON.stringify(payload);
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    process.stdout.write(formatLog("info", message, meta) + "\n");
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    process.stderr.write(formatLog("warn", message, meta) + "\n");
  },
  error(message: string, meta?: Record<string, unknown>): void {
    process.stderr.write(formatLog("error", message, meta) + "\n");
  },
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      process.stdout.write(formatLog("debug", message, meta) + "\n");
    }
  },
};
