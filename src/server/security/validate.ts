import "server-only";
import { z } from "zod";

export interface SafeValidationError {
  success: false;
  errors: Record<string, string>;
  message: string;
}

export interface SafeValidationSuccess<T> {
  success: true;
  data: T;
}

export type SafeValidationResult<T> = SafeValidationSuccess<T> | SafeValidationError;

/**
 * Validates arbitrary input using a Zod schema.
 * Returns either typed data or sanitized, user-facing error messages without exposing internals.
 */
export function validateInput<T>(schema: z.ZodType<T>, input: unknown): SafeValidationResult<T> {
  const result = schema.safeParse(input);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};

    for (const issue of result.error.issues) {
      const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "_general";
      if (!fieldErrors[fieldPath]) {
        fieldErrors[fieldPath] = issue.message;
      }
    }

    return {
      success: false,
      errors: fieldErrors,
      message: "Validation failed. Please check the entered fields.",
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
