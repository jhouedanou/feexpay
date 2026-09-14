import { z } from 'zod'

const Body = z.object({ type: z.enum(['dirigeant', 'rayonnement']) }).strict()

/**
 * POST /api/public/participations — ouvre une participation sur la version publiée.
 * Une participation en cours du même type est reprise plutôt que dupliquée : le parcours
 * doit survivre à un reload (PLAN.md §12, « reprise après reload »).
 */
export default defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) {
    throw apiError(event, 'VALIDATION_ERROR', 'Champ `type` requis (dirigeant|rayonnement).')
  }
  const { type } = parsed.data

  const session = await ensureSession(event)
  const version = await publishedVersion(event)

  const token = newToken()
  const row = await tx(async (c) => {
    // Reprise : une seule participation ouverte par (session, type).
    const open = await c.query<{ id: string }>(
      `select id from participation
        where session_id = $1 and diagnostic_type = $2 and status = 'in_progress'
        limit 1`,
      [session.id, type]
    )
    if (open.rowCount) {
      // Le jeton d'origine n'est pas récupérable (seul son hash est stocké) :
      // on en émet un nouveau pour la même participation.
      const { rows } = await c.query<{ id: string; started_at: Date }>(
        `update participation set token_hash = $1 where id = $2 returning id, started_at`,
        [hashToken(token), open.rows[0]!.id]
      )
      return { ...rows[0]!, resumed: true }
    }
    const { rows } = await c.query<{ id: string; started_at: Date }>(
      `insert into participation (session_id, diagnostic_type, version_id, token_hash)
       values ($1, $2, $3, $4) returning id, started_at`,
      [session.id, type, version.id, hashToken(token)]
    )
    return { ...rows[0]!, resumed: false }
  })

  setResponseStatus(event, row.resumed ? 200 : 201)
  return {
    token,
    type,
    version: version.version,
    status: 'in_progress' as const,
    resumed: row.resumed,
    total: QUESTION_COUNT[type],
    startedAt: row.started_at,
    correlation_id: event.context.correlationId,
  }
})
