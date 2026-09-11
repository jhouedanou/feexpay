import { timingSafeEqual } from 'node:crypto'
import { envoyerRelance } from '../../utils/email'
import { reportById } from '../../utils/report'

const LOT_MAX = 100

/**
 * GET /api/cron/relance — relance à 7 jours (décision FeexPay du 11 septembre 2026).
 *
 * Cible : le dernier rapport de chaque contact, prêt depuis au moins sept jours, qui ne
 * couvre qu'un diagnostic, quand le contact n'a pas terminé le second depuis et n'a jamais
 * reçu de relance. Un contact qui a demandé la suppression de ses données est exclu.
 * Une seule relance par contact, quoi qu'il arrive ensuite.
 *
 * Appelée chaque matin en GET avec `Authorization: Bearer $CRON_SECRET`, comme
 * /api/cron/abandon (Vercel Cron via vercel.json ; sur Render, un cron job qui appelle l'URL).
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
    `with dernier as (
       select distinct on (r.contact_id) r.id, r.contact_id, r.created_at, r.snapshot_refs
         from report r
        where r.status = 'ready'
        order by r.contact_id, r.created_at desc
     )
     select d.id
       from dernier d
       join contact c on c.id = d.contact_id
      where d.created_at <= now() - interval '7 days'
        and jsonb_array_length(coalesce(d.snapshot_refs->'score_snapshot_ids', '[]'::jsonb)) = 1
        and (select count(distinct p.diagnostic_type) from participation p
              where p.contact_id = d.contact_id and p.status = 'completed') < 2
        and not exists (select 1 from notification n join report r2 on r2.id = n.report_id
                         where r2.contact_id = d.contact_id and n.template = 'relance')
        and not exists (select 1 from deletion_request q
                         where q.email = c.email_norm and q.status in ('pending', 'verified', 'done'))
      order by d.created_at
      limit $1`,
    [LOT_MAX],
  )

  let envoyes = 0
  let echecs = 0
  for (const { id } of rows) {
    const rapport = await reportById(id)
    if (!rapport) continue
    const r = await envoyerRelance(rapport, id)
    if (r.sent) envoyes += 1
    else echecs += 1
  }
  console.info('[cron:relance]', rows.length, 'candidat(s),', envoyes, 'envoyé(s),', echecs, 'échec(s)')
  return { candidats: rows.length, envoyes, echecs, correlation_id: event.context.correlationId }
})
