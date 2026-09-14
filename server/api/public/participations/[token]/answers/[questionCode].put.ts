import { z } from 'zod'

const Body = z.object({ optionCode: z.string().regex(/^(Q([1-9]|1[0-4])|R[1-7])[A-D]$/) }).strict()

/**
 * PUT /api/public/participations/{token}/answers/{questionCode} — idempotent.
 * L'historisation (`answer_history`) et la cohérence option↔question sont assurées
 * par les triggers en base : on ne les redouble pas ici.
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const questionCode = getRouterParam(event, 'questionCode')
  if (!token || !questionCode) throw apiError(event, 'VALIDATION_ERROR', 'Paramètres manquants.')

  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Champ `optionCode` invalide.')
  const { optionCode } = parsed.data

  if (!optionCode.startsWith(questionCode)) {
    throw apiError(
      event,
      'INVALID_ANSWER',
      `L'option ${optionCode} n'appartient pas à la question ${questionCode}.`
    )
  }

  const session = await requireSession(event)
  const p = await participationByToken(event, token, session.id)

  if (p.status === 'completed') {
    throw apiError(
      event,
      'DUPLICATE_SUBMISSION',
      'Participation déjà complétée : son snapshot est immuable.'
    )
  }

  const target = await db().query<{ qid: string; oid: string }>(
    `select q.id as qid, o.id as oid
       from question q join "option" o on o.question_id = q.id
      where q.version_id = $1 and q.diagnostic_type = $2 and q.code = $3 and o.code = $4`,
    [p.version_id, p.diagnostic_type, questionCode, optionCode]
  )
  if (!target.rowCount) {
    throw apiError(event, 'INVALID_ANSWER', `Couple ${questionCode}/${optionCode} inconnu.`)
  }
  const { qid, oid } = target.rows[0]!

  const answered = await tx(async (c) => {
    await c.query(
      `insert into answer (participation_id, question_id, option_id)
       values ($1, $2, $3)
       on conflict (participation_id, question_id) do update
         set option_id  = excluded.option_id,
             revised_at = case when answer.option_id <> excluded.option_id
                               then now() else answer.revised_at end`,
      [p.id, qid, oid]
    )
    // Répondre à nouveau relance un parcours abandonné (reprise à 7 j).
    if (p.status === 'abandoned') {
      await c.query(`update participation set status = 'in_progress' where id = $1`, [p.id])
    }
    const { rows } = await c.query<{ n: string }>(
      `select count(*)::int as n from answer where participation_id = $1`,
      [p.id]
    )
    return Number(rows[0]!.n)
  })

  const total = QUESTION_COUNT[p.diagnostic_type]
  return {
    questionCode,
    optionCode,
    answered,
    total,
    complete: answered === total,
    status: p.status === 'abandoned' ? 'in_progress' : p.status,
    correlation_id: event.context.correlationId,
  }
})
