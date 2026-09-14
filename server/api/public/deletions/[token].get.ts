import { demandeParJeton } from '../../../utils/deletion'

/** GET /api/public/deletions/{token} — validité du lien, avant d'afficher la confirmation. */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')
  const d = await demandeParJeton(event, token)
  // L'adresse est masquée : le lien peut avoir été transféré.
  const [avant, apres] = d.email.split('@')
  return { email: `${avant!.slice(0, 2)}…@${apres}`, expires_at: d.expires_at }
})
