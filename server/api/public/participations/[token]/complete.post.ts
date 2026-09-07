import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { ScoringError, buildInsights, scoreDirigeant, scoreRayonnement } from '@radar/scoring'
import { schema, useDb } from '../../../../utils/db'
import { loadAnswers, requireParticipation } from '../../../../utils/participation'
import { toPublicResult } from '../../../../utils/result'

/** Valide, calcule, snapshot. Idempotent : re-appel → même snapshot. */
export default defineEventHandler(async (event) => {
  const p = await requireParticipation(event)
  const db = useDb()

  if (p.status === 'completed') {
    const [snap] = await db.select().from(schema.scoreSnapshot).where(eq(schema.scoreSnapshot.participationId, p.id)).limit(1)
    if (snap) return { result: toPublicResult(p.diagnosticType, snap.result), event_id: randomUUID(), idempotent: true }
  }

  const answers = await loadAnswers(p.id)
  let scores: unknown
  let result: unknown
  let tieBreak: unknown = null
  try {
    if (p.diagnosticType === 'dirigeant') {
      const { raw, norm, affinites, pilotage, tieBreak: tb, ...rest } = scoreDirigeant(answers)
      scores = { raw, norm, affinites, pilotage }
      result = { ...rest, norm }
      tieBreak = tb
    } else {
      const r = scoreRayonnement(answers)
      scores = { dims: r.dims, score: r.score }
      result = r
    }
  } catch (e) {
    if (e instanceof ScoringError) throw apiError(event, e.code, e.message)
    throw e
  }
  const insights = buildInsights(p.diagnosticType === 'dirigeant' ? answers : null, p.diagnosticType === 'rayonnement' ? answers : null)
  const now = new Date()

  await db.transaction(async (tx) => {
    await tx.insert(schema.scoreSnapshot).values({ participationId: p.id, versionId: p.versionId, scores, result, tieBreak })
    await tx.insert(schema.insightSnapshot).values({ participationId: p.id, versionId: p.versionId, items: insights })
    await tx
      .update(schema.participation)
      .set({ status: 'completed', completedAt: now, durationS: Math.round((now.getTime() - p.startedAt.getTime()) / 1000) })
      .where(eq(schema.participation.id, p.id))
  })
  return { result: toPublicResult(p.diagnosticType, result), event_id: randomUUID(), idempotent: false }
})
