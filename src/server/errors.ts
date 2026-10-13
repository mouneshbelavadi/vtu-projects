import "server-only";

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isPublic: boolean;

  constructor(message: string, code = "INTERNAL_ERROR", statusCode = 500, isPublic = true) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.isPublic = isPublic;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toPublicError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
} {
  if (isAppError(error) && error.isPublic) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }
  return {
    message: "An unexpected error occurred. Please try again.",
    code: "INTERNAL_ERROR",
    statusCode: 500,
  };
}
