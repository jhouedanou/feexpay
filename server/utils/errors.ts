import type { H3Event } from 'h3'

/** Codes d'erreur du contrat public (PLAN.md §6). */
export type ApiErrorCode =
  | 'INVALID_ANSWER'
  | 'INCOMPLETE_PARTICIPATION'
  | 'SESSION_EXPIRED'
  | 'VERSION_INACTIVE'
  | 'DUPLICATE_SUBMISSION'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'

const STATUS: Record<ApiErrorCode, number> = {
  INVALID_ANSWER: 422,
  INCOMPLETE_PARTICIPATION: 422,
  SESSION_EXPIRED: 401,
  VERSION_INACTIVE: 409,
  DUPLICATE_SUBMISSION: 409,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
}

/**
 * Erreur métier. Chaque réponse porte le `correlation_id` posé par le middleware,
 * de sorte qu'un incident remonté par un utilisateur soit traçable dans les logs.
 */
export function apiError(event: H3Event, code: ApiErrorCode, message: string) {
  return createError({
    statusCode: STATUS[code],
    statusMessage: code,
    data: { code, message, correlation_id: event.context.correlationId },
  })
}
