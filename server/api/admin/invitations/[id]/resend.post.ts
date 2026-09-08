import { requireAdmin } from '../../../../utils/admin-auth'
import { creerInvitation } from '../../../../utils/invitations'

/** Renvoi : nouvelle invitation, l'ancienne est révoquée (le jeton précédent devient inutilisable). */
export default defineEventHandler(async (event) => {
  const ctx = await requireAdmin(event, 'admin')
  const id = getRouterParam(event, 'id')
  const { rows } = await db().query<any>(`select * from admin_invitation where id = $1`, [id])
  const inv = rows[0]
  if (!inv) throw apiError(event, 'NOT_FOUND', 'Invitation introuvable.')
  return creerInvitation(event, {
    email: inv.email, prenom: inv.prenom ?? '', nom: inv.nom ?? '', role: inv.role, team: inv.team,
    mfa_required: inv.mfa_required, geo_restricted: inv.geo_restricted, export_allowed: inv.export_allowed,
  }, ctx.user.id)
})
