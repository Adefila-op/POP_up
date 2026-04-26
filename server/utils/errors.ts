/**
 * Error Handling - Standardized error responses
 */

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  statusCode: number;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  statusCode: number;
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Common error codes
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  INVALID_STATE: "INVALID_STATE",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  IP_NOT_FOUND: "IP_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

/**
 * Create error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: Record<string, unknown>,
): ErrorResponse {
  return {
    success: false,
    error: { code, message, details },
    statusCode,
  };
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(data: T, statusCode: number = 200): SuccessResponse<T> {
  return {
    success: true,
    data,
    statusCode,
  };
}

/**
 * Handle errors and format response
 */
export function handleError(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return createErrorResponse(error.code, error.message, error.statusCode, error.details);
  }

  if (error instanceof Error) {
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, error.message, 500);
  }

  return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, "An unexpected error occurred", 500);
}

/**
 * Create HTTP response
 */
export function createHTTPResponse<T>(response: ErrorResponse | SuccessResponse<T>): Response {
  const statusCode = response.statusCode;
  const body = {
    success: response.success,
    ...(response.success ? { data: response.data } : { error: response.error }),
  };

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
