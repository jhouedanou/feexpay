import { resetParJeton } from '../../../../utils/password-reset'

/**
 * GET /api/admin/auth/reset/{token} — validité du lien, avant d'afficher le formulaire.
 * Ne renvoie que le prénom : de quoi personnaliser l'écran, rien de plus.
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')
  const reset = await resetParJeton(event, token)
  return { prenom: reset.prenom, expires_at: reset.expires_at }
})
