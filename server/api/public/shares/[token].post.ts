import { z } from 'zod'
import { currentSession } from '../../../utils/session'

/**
 * POST /api/public/shares/{token} — enregistre la carte de partage produite en P13/P14.
 *
 * La carte est dessinée sur un canvas dans le navigateur. Deux choses lui arrivent ici : sa
 * trace (quel diagnostic, quel format, quand), et — pour la bannière 1200 × 630 — l'image
 * elle-même, qui servira d'aperçu aux robots de WhatsApp et de LinkedIn.
 *
 * Pourquoi renvoyer l'image au serveur plutôt que la refabriquer : le navigateur la dessine
 * déjà exactement comme l'internaute l'a vue. Un second moteur de rendu côté serveur voudrait
 * une dépendance binaire, une police en TTF que le pack ne fournit pas, et deux rendus à tenir
 * en phase.
 *
 * `token` est celui de la participation (depuis P08/P09) ou celui du rapport (depuis
 * P11/P12, avec `rapport=1`) : les deux chemins mènent à la même participation.
 *
 * La réponse porte un jeton public — celui de la carte, sans rapport avec le jeton de rapport,
 * qui ouvre lui un document nominatif et ne doit jamais être partagé.
 */
const Champs = z
  .object({
    format: z.enum(['1080x1350', '1080x1080', '1200x630', '1080x1920']),
    diagnostic: z.enum(['dirigeant', 'rayonnement']),
    rapport: z.enum(['0', '1']).optional(),
    objectKey: z.string().trim().min(1).max(200),
  })
  .strict()

/** Une bannière d'aperçu pèse quelques centaines de kilo-octets ; au-delà, on refuse. */
const TAILLE_MAX = 3 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')

  const parties = await readMultipartFormData(event).catch(() => null)
  if (!parties) throw apiError(event, 'VALIDATION_ERROR', 'Carte de partage invalide.')

  const champs: Record<string, string> = {}
  let image: Buffer | null = null
  for (const p of parties) {
    if (p.name === 'image') {
      if (p.data.length > TAILLE_MAX) throw apiError(event, 'VALIDATION_ERROR', 'Image trop lourde.')
      if (p.type !== 'image/png') throw apiError(event, 'VALIDATION_ERROR', 'Image attendue au format PNG.')
      image = p.data
    } else if (p.name) {
      champs[p.name] = p.data.toString('utf8')
    }
  }

  const parsed = Champs.safeParse(champs)
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Carte de partage invalide.')
  const { format, diagnostic, objectKey } = parsed.data
  const depuisRapport = parsed.data.rapport === '1'

  let participationId: string
  let reportId: string | null = null

  if (depuisRapport) {
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

  // Le jeton public de la carte est stable pour une participation et un format : le
  // régénérer à chaque partage invaliderait les liens déjà envoyés.
  const existant = await db().query<{ jeton: string | null }>(
    `select jeton from share_asset where participation_id = $1 and format = $2`,
    [participationId, format],
  )
  const jeton = existant.rows[0]?.jeton ?? newToken()

  await db().query(
    `insert into share_asset (report_id, participation_id, format, object_key, token_hash, jeton, image, image_type, image_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, case when $7::bytea is null then null else now() end)
     on conflict (participation_id, format)
       do update set report_id   = excluded.report_id,
                     object_key  = excluded.object_key,
                     image       = coalesce(excluded.image, share_asset.image),
                     image_type  = coalesce(excluded.image_type, share_asset.image_type),
                     image_at    = coalesce(excluded.image_at, share_asset.image_at),
                     created_at  = now()`,
    [reportId, participationId, format, objectKey, hashToken(jeton), jeton, image, image ? 'image/png' : null],
  )

  setResponseStatus(event, 201)
  return { format, jeton, correlation_id: event.context.correlationId }
})
