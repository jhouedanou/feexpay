import { requireAdmin } from '../../../../utils/admin-auth'
import { renvoyerRapport } from '../../../../utils/rapports'

/** POST /api/admin/prospects/:id/rapport — A04 « Renvoyer le rapport » : dernier rapport du contact, même snapshot, nouveau jeton. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'commercial')
  const id = getRouterParam(event, 'id')!
  const { rows } = await db().query<{ id: string }>(`select id from report where contact_id = $1 order by created_at desc limit 1`, [id])
  if (!rows[0]) throw apiError(event, 'NOT_FOUND', 'Aucun rapport pour ce contact.')
  return renvoyerRapport(event, rows[0].id)
})
