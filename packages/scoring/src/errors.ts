/** Codes d'erreur du moteur — repris tels quels par l'API (PLAN §6). */
export type ScoringErrorCode = 'INVALID_ANSWER' | 'INCOMPLETE_PARTICIPATION' | 'VERSION_INACTIVE'

export class ScoringError extends Error {
  readonly code: ScoringErrorCode
  readonly details: Record<string, unknown>

  constructor(code: ScoringErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ScoringError'
    this.code = code
    this.details = details
  }
}
