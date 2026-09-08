/**
 * GET /api/public/participations/{token} — état du parcours : questions de la version
 * épinglée, réponses déjà données, index de reprise. Aucun élément de barème.
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')

  const session = await requireSession(event)
  const p = await participationByToken(event, token, session.id)

  const questions = await questionsFor(p.version_id, p.diagnostic_type)
  const answers = await answersFor(p.id)

  return {
    token,
    type: p.diagnostic_type,
    version: p.version,
    status: p.status,
    startedAt: p.started_at,
    completedAt: p.completed_at,
    total: QUESTION_COUNT[p.diagnostic_type],
    answered: Object.keys(answers).length,
    currentIndex: currentIndex(questions, answers),
    questions,
    answers,
    correlation_id: event.context.correlationId,
  }
})
