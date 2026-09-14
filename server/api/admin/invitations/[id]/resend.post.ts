import { requireAdmin } from '../../../../utils/admin-auth'
import { creerInvitation } from '../../../../utils/invitations'

/** Renvoi : nouvelle invitation, l'ancienne est révoquée (le jeton précédent devient inutilisable). */
export default defineEventHandler(async (event) => {
  const ctx = await requireAdmin(event, 'admin')
  const id = getRouterParam(event, 'id')
  // Seule une invitation en attente se renvoie : renvoyer une invitation acceptée
  // permettrait de reposer le mot de passe d'un compte existant (audit du 11 septembre 2026).
  const { rows } = await db().query<any>(`select * from admin_invitation where id = $1 and status = 'pending'`, [id])
  const inv = rows[0]
  if (!inv) throw apiError(event, 'NOT_FOUND', 'Invitation introuvable ou déjà traitée.')
  return creerInvitation(event, {
    email: inv.email, prenom: inv.prenom ?? '', nom: inv.nom ?? '', role: inv.role, team: inv.team,
    mfa_required: inv.mfa_required, geo_restricted: inv.geo_restricted, export_allowed: inv.export_allowed,
  }, ctx.user.id)
})
