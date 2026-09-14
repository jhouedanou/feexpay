import { z } from 'zod'
import { requireAdmin } from '../../../utils/admin-auth'
import recette from '../../../data/recette.json'

const Body = z.object({ statut: z.enum(['ok', 'ko', 'passe']).nullable(), note: z.string().trim().max(500).default('') }).strict()
const CONTROLES = new Set(recette.sections.flatMap((s) => s.controles.map((c) => c.k)))

/**
 * PUT /api/admin/recette/{controle} — le résultat du testeur connecté sur un contrôle.
 * `statut` null efface son résultat. Chacun n'écrit que sa propre ligne.
 */
export default defineEventHandler(async (event) => {
  const ctx = await requireAdmin(event, 'lecture')
  const controle = getRouterParam(event, 'controle') ?? ''
  if (!CONTROLES.has(controle)) throw apiError(event, 'NOT_FOUND', 'Contrôle inconnu.')
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Résultat invalide.')
  const { statut, note } = parsed.data
  if (!statut) {
    await db().query(`delete from recette_resultat where controle = $1 and testeur_id = $2`, [controle, ctx.user.id])
  } else {
    await db().query(
      `insert into recette_resultat (controle, testeur_id, statut, note, updated_at) values ($1, $2, $3, $4, now())
       on conflict (controle, testeur_id) do update set statut = excluded.statut, note = excluded.note, updated_at = now()`,
      [controle, ctx.user.id, statut, note],
    )
  }
  return { controle, statut, note, correlation_id: event.context.correlationId }
})
