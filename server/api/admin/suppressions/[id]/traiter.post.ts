import { z } from 'zod'
import { requireAdmin } from '../../../../utils/admin-auth'
import { appliquerSuppression, rejeterSuppression } from '../../../../utils/deletion'

const Body = z.object({ action: z.enum(['supprimer', 'rejeter']), motif: z.string().trim().max(500).optional() }).strict()

/**
 * POST /api/admin/suppressions/{id}/traiter — prononce la suppression, ou la refuse.
 *
 * Réservé à un Administrateur : c'est une opération irréversible qui touche aux données d'une
 * personne. Le rejet exige un motif, qui reste au journal.
 */
export default defineEventHandler(async (event) => {
  const ctx = await requireAdmin(event, 'admin')
  const id = getRouterParam(event, 'id')!
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Action attendue.')

  if (parsed.data.action === 'rejeter') {
    if (!parsed.data.motif) throw apiError(event, 'VALIDATION_ERROR', 'Un refus doit être motivé.')
    await rejeterSuppression(event, id, parsed.data.motif, ctx.user.id)
    return { ok: true, action: 'rejeter' as const }
  }

  const compte = await appliquerSuppression(event, id, ctx.user.id)
  return { ok: true, action: 'supprimer' as const, ...compte }
})
