import { z } from 'zod'
import { currentSession } from '../../../utils/session'

/**
 * POST /api/public/shares/{token} — enregistre la carte de partage produite en P13/P14.
 *
 * La carte est dessinée sur un canvas dans le navigateur et enregistrée sur l'appareil :
 * aucun fichier ne transite par le serveur, contrairement au dépôt sur Storage prévu à
 * l'origine (PLAN.md §9 étape 14). Ce qui est conservé ici, c'est la trace : quel
 * diagnostic a été partagé, dans quel format, à quelle date. `object_key` désigne le nom
 * du fichier remis à l'internaute, pas un objet stocké.
 *
 * `token` est celui de la participation (depuis P08/P09) ou celui du rapport (depuis
 * P11/P12, avec `rapport=1`) : les deux chemins mènent à la même participation.
 */
const Body = z
  .object({
    format: z.enum(['1080x1350', '1080x1080', '1200x630', '1080x1920']),
    diagnostic: z.enum(['dirigeant', 'rayonnement']),
    rapport: z.boolean().optional(),
    objectKey: z.string().trim().min(1).max(200),
  })
  .strict()

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Carte de partage invalide.')
  const { format, diagnostic, rapport, objectKey } = parsed.data

  let participationId: string
  let reportId: string | null = null

  if (rapport) {
    // Jeton de rapport : non lié à la session, il est reçu par email et reste valable.
    const { rows } = await db().query<{ id: string; participation_id: string }>(
      `select r.id, s.participation_id
         from report r
         join score_snapshot s
           on s.id = any (
                select jsonb_array_elements_text(r.snapshot_refs -> 'score_snapshot_ids')::uuid
              )
         join participation p on p.id = s.participation_id
        where r.token_hash = $1 and r.status <> 'revoked' and p.diagnostic_type = $2`,
      [hashToken(token), diagnostic],
    )
    const row = rows[0]
    if (!row) throw apiError(event, 'NOT_FOUND', 'Rapport introuvable ou expiré.')
    reportId = row.id
    participationId = row.participation_id
  } else {
    const session = await currentSession(event)
    if (!session) throw apiError(event, 'SESSION_EXPIRED', 'Session absente ou expirée.')
    const { rows } = await db().query<{ id: string }>(
      `select id from participation
        where token_hash = $1 and session_id = $2 and diagnostic_type = $3 and status = 'completed'`,
      [hashToken(token), session.id, diagnostic],
    )
    const row = rows[0]
    if (!row) throw apiError(event, 'NOT_FOUND', 'Participation introuvable.')
    participationId = row.id
  }

  // Une carte par participation et par format : régénérer le même format rafraîchit la
  // ligne au lieu d'en créer une seconde.
  await db().query(
    `insert into share_asset (report_id, participation_id, format, object_key, token_hash)
     values ($1, $2, $3, $4, $5)
     on conflict (participation_id, format)
       do update set report_id = excluded.report_id,
                     object_key = excluded.object_key,
                     created_at = now()`,
    [reportId, participationId, format, objectKey, hashToken(`${participationId}:${format}`)],
  )

  setResponseStatus(event, 201)
  return { format, correlation_id: event.context.correlationId }
})
