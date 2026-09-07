import type { H3Event } from 'h3'

export type ApiErrorCode =
  | 'INVALID_ANSWER'
  | 'INCOMPLETE_PARTICIPATION'
  | 'SESSION_EXPIRED'
  | 'VERSION_INACTIVE'
  | 'DUPLICATE_SUBMISSION'
  | 'REPORT_PENDING'
  | 'FORBIDDEN_SCOPE'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'

const STATUS: Record<ApiErrorCode, number> = {
  INVALID_ANSWER: 400,
  INCOMPLETE_PARTICIPATION: 409,
  SESSION_EXPIRED: 401,
  VERSION_INACTIVE: 503,
  DUPLICATE_SUBMISSION: 409,
  REPORT_PENDING: 202,
  FORBIDDEN_SCOPE: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
}

export function apiError(event: H3Event, code: ApiErrorCode, message?: string, details?: unknown) {
  return createError({
    statusCode: STATUS[code],
    statusMessage: code,
    data: { code, message: message ?? code, details, correlation_id: event.context.correlationId },
  })
}
