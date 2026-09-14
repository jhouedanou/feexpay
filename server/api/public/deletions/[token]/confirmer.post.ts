import { confirmerSuppression } from '../../../../utils/deletion'

/**
 * POST /api/public/deletions/{token}/confirmer — confirme la demande.
 *
 * Elle entre alors dans la file de l'administration : la suppression n'est pas automatique,
 * une personne la prononce et en répond.
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')
  await confirmerSuppression(event, token)
  return { ok: true, correlation_id: event.context.correlationId }
})
