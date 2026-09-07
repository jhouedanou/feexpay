import { questionsOf } from '@radar/scoring'
import { loadAnswers, requireParticipation } from '../../../utils/participation'

export default defineEventHandler(async (event) => {
  const p = await requireParticipation(event)
  const answers = await loadAnswers(p.id)
  const qs = questionsOf(p.diagnosticType)
  const firstUnanswered = qs.findIndex((q) => !answers[q.code])
  return {
    type: p.diagnosticType,
    status: p.status,
    total: qs.length,
    answers,
    current_index: firstUnanswered === -1 ? qs.length : firstUnanswered + 1,
    started_at: p.startedAt,
    completed_at: p.completedAt,
  }
})
