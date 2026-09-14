import { requireAdmin, audit } from '../../../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'admin')
  const id = getRouterParam(event, 'id')
  const r = await db().query(`update admin_invitation set status = 'revoked' where id = $1 and status = 'pending'`, [id])
  if (!r.rowCount) throw apiError(event, 'NOT_FOUND', 'Aucune invitation en attente.')
  await audit(event, 'invitation.cancelled', 'admin_invitation', id ?? null)
  return { ok: true }
})
