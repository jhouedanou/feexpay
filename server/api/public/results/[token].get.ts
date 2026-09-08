/**
 * GET /api/public/results/{token} — résultat public d'un parcours complété (P08/P09).
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')

  const session = await requireSession(event)
  const p = await participationByToken(event, token, session.id)

  if (p.status !== 'completed') {
    throw apiError(event, 'INCOMPLETE_PARTICIPATION', 'Parcours non terminé.')
  }
  return { token, ...(await readSnapshot(event, p.id)) }
})
