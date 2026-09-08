import { reportByToken } from '../../../utils/report'

/**
 * GET /api/public/reports/{token} — rapport détaillé (P12), consultable depuis le lien
 * remis en P11 et envoyé par email. Le jeton de rapport suffit : pas de session exigée.
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token || token.length < 20) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')
  const rapport = await reportByToken(event, token)
  return { ...rapport, correlation_id: event.context.correlationId }
})
