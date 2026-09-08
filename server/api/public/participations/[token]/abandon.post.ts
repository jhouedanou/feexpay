/**
 * POST /api/public/participations/{token}/abandon — marque le parcours abandonné.
 * Non destructif : les réponses restent, et répondre à nouveau relance la participation
 * tant que la session vit (7 j).
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')

  const session = await requireSession(event)
  const p = await participationByToken(event, token, session.id)

  if (p.status === 'completed') {
    throw apiError(event, 'DUPLICATE_SUBMISSION', 'Participation déjà complétée.')
  }

  await db().query(`update participation set status = 'abandoned' where id = $1`, [p.id])

  return { token, status: 'abandoned' as const, correlation_id: event.context.correlationId }
})
