/** Standardized API error structure for all service layer responses */
export interface ApiError {
  code: string;
  message: string;
  details?: string;
}

/** Known error codes for the application */
export const ErrorCodes = {
  // Auth errors
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',

  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/** Wrap a Supabase error into a standardized ApiError */
export function toApiError(error: { message: string; code?: string; details?: string }): ApiError {
  const pgCode = error.code ?? '';

  // Map common PostgreSQL/Supabase error codes
  if (pgCode === '42501' || pgCode === 'PGRST301') {
    return { code: ErrorCodes.NOT_AUTHORIZED, message: 'You do not have permission for this action', details: error.message };
  }
  if (pgCode === '23505') {
    return { code: ErrorCodes.ALREADY_EXISTS, message: 'This resource already exists', details: error.message };
  }
  if (pgCode === '23503') {
    return { code: ErrorCodes.NOT_FOUND, message: 'Referenced resource not found', details: error.message };
  }
  if (pgCode === '23514') {
    return { code: ErrorCodes.VALIDATION_FAILED, message: 'Validation constraint failed', details: error.message };
  }

  return { code: ErrorCodes.INTERNAL_ERROR, message: error.message, details: error.details };
}

/** Type guard to check if a value is an ApiError */
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  );
}

/** Standardized result type for service functions */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

/** Helper to create a success result */
export function ok<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

/** Helper to create an error result */
export function err<T>(error: ApiError): ServiceResult<T> {
  return { success: false, error };
}
