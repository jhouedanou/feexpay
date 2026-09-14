import { currentAdmin, ROLE_LABEL } from '../../../utils/admin-auth'

/** Contexte de l'admin connecté, sans exiger le second facteur (l'interface décide où l'envoyer). */
export default defineEventHandler(async (event) => {
  const ctx = await currentAdmin(event)
  if (!ctx) throw apiError(event, 'UNAUTHENTICATED', 'Connexion requise.')
  const u = ctx.user
  return {
    user: { id: u.id, prenom: u.prenom, nom: u.nom, email: u.email, role: u.role, roleLabel: ROLE_LABEL[u.role], team: u.team, status: u.status, export_allowed: u.export_allowed },
    aal: ctx.aal,
    mfa: { requise: ctx.mfaRequise, enrolee: Boolean(u.mfa_enrolled_at), verifiee: ctx.aal === 'aal2' },
  }
})
