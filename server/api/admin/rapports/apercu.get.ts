import { requireAdmin } from '../../../utils/admin-auth'
import { htmlRapport } from '../../../utils/email'
import { rapportDeControle } from '../../../utils/apercu-email'
import { chargerModele, estCleModele } from '../../../utils/modeles-email'

/**
 * GET /api/admin/rapports/apercu?modele=dirigeant|rayonnement|croise — A07 « Modèles d'email » :
 * rendu HTML du modèle tel qu'il partirait aujourd'hui, avec le cas de contrôle principal.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'commercial')
  const demande = getQuery(event).modele ?? 'croise'
  const modele = estCleModele(demande) ? demande : 'croise'
  const { champs } = await chargerModele(modele)
  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  return htmlRapport(rapportDeControle(modele), `${useRuntimeConfig().public.appBaseUrl}/rapport/apercu`, champs)
})
