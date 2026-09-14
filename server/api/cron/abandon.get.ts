import { timingSafeEqual } from 'node:crypto'

/**
 * GET /api/cron/abandon — clôture des parcours laissés en plan (PLAN.md §9 étape 9).
 *
 * `POST /api/public/participations/{token}/abandon` n'est appelé que par le navigateur,
 * quand l'internaute quitte explicitement. Un onglet fermé, un téléphone verrouillé ou une
 * perte de réseau laissent la participation en `in_progress` indéfiniment, ce qui fausse le
 * taux de complétion du dashboard A02.
 *
 * Critère retenu : la session de reprise a expiré. `currentSession` repousse l'échéance à
 * chaque requête, donc une session expirée signifie sept jours sans le moindre passage — le
 * parcours n'est plus reprenable, il est abandonné. Les réponses ne sont pas touchées.
 *
 * Vercel Cron appelle la route en GET avec `Authorization: Bearer $CRON_SECRET`.
 */
export default defineEventHandler(async (event) => {
  const { cronSecret } = useRuntimeConfig()
  if (!cronSecret) throw apiError(event, 'FORBIDDEN_SCOPE', 'CRON_SECRET non configuré.')

  const fourni = (getRequestHeader(event, 'authorization') ?? '').replace(/^Bearer\s+/i, '')
  const a = Buffer.from(fourni)
  const b = Buffer.from(cronSecret)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw apiError(event, 'UNAUTHENTICATED', 'Jeton de tâche planifiée invalide.')
  }

  const { rows } = await db().query<{ id: string }>(
    `update participation p
        set status = 'abandoned'
       from anonymous_session s
      where s.id = p.session_id
        and p.status = 'in_progress'
        and s.expires_at < now()
      returning p.id`,
  )

  // Volumétrie suivie dans les logs : une variation brutale signale un incident de session
  // plutôt qu'un changement de comportement.
  console.info('[cron:abandon]', rows.length, 'participation(s) clôturée(s)')

  return {
    traitees: rows.length,
    correlation_id: event.context.correlationId,
  }
})
