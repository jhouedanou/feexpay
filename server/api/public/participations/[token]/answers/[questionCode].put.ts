import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDb } from '../../../../../utils/db'
import { requireParticipation } from '../../../../../utils/participation'

const Body = z.object({ optionCode: z.string().regex(/^[QR]\d{1,2}[A-D]$/) })

/** Idempotent : upsert de la réponse ; l'historique est journalisé par trigger DB. */
export default defineEventHandler(async (event) => {
  const p = await requireParticipation(event)
  if (p.status !== 'in_progress') throw apiError(event, 'DUPLICATE_SUBMISSION', 'Participation déjà terminée')
  const questionCode = getRouterParam(event, 'questionCode') ?? ''
  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', undefined, parsed.error.flatten())
  const { optionCode } = parsed.data
  if (optionCode.slice(0, -1) !== questionCode) throw apiError(event, 'INVALID_ANSWER', 'Option hors question')

  const db = useDb()
  const [opt] = await db
    .select({ optionId: schema.option.id, questionId: schema.question.id, type: schema.question.diagnosticType })
    .from(schema.option)
    .innerJoin(schema.question, eq(schema.option.questionId, schema.question.id))
    .where(and(eq(schema.question.versionId, p.versionId), eq(schema.option.code, optionCode), eq(schema.question.code, questionCode)))
    .limit(1)
  if (!opt || opt.type !== p.diagnosticType) throw apiError(event, 'INVALID_ANSWER')

  await db
    .insert(schema.answer)
    .values({ participationId: p.id, questionId: opt.questionId, optionId: opt.optionId })
    .onConflictDoUpdate({
      target: [schema.answer.participationId, schema.answer.questionId],
      set: { optionId: opt.optionId, revisedAt: new Date() },
    })
  return { ok: true, questionCode, optionCode }
})
