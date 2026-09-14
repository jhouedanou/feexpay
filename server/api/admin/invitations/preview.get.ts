import { invitationParJeton } from '../../../utils/invitations'
import { ROLE_LABEL } from '../../../utils/admin-auth'

/** Détail affiché sur la page d'acceptation, à partir du jeton (query `token`). */
export default defineEventHandler(async (event) => {
  const token = String(getQuery(event).token ?? '')
  if (token.length < 20) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')
  const inv = await invitationParJeton(event, token)
  const { rows } = await db().query<{ prenom: string; nom: string }>(`select prenom, nom from admin_user where id = $1`, [inv.inviter_id])
  return {
    email: inv.email, prenom: inv.prenom, nom: inv.nom, role: inv.role, roleLabel: ROLE_LABEL[inv.role],
    team: inv.team, mfa_required: inv.mfa_required || inv.role === 'analyste' || inv.role === 'admin',
    expires_at: inv.expires_at, invitant: rows[0] ? `${rows[0].prenom} ${rows[0].nom}` : 'FeexPay',
  }
})
