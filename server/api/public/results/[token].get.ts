import { eq } from 'drizzle-orm'
import { schema, useDb } from '../../../utils/db'
import { requireParticipation } from '../../../utils/participation'
import { toPublicResult } from '../../../utils/result'

export default defineEventHandler(async (event) => {
  const p = await requireParticipation(event)
  if (p.status !== 'completed') throw apiError(event, 'INCOMPLETE_PARTICIPATION')
  const [snap] = await useDb().select().from(schema.scoreSnapshot).where(eq(schema.scoreSnapshot.participationId, p.id)).limit(1)
  if (!snap) throw apiError(event, 'NOT_FOUND')
  return toPublicResult(p.diagnosticType, snap.result)
})
