import { nomFichierPdf, rapportPdf } from '../../../../utils/pdf'
import { reportByToken } from '../../../../utils/report'

/**
 * GET /api/public/reports/{token}/pdf — le rapport au format PDF, généré à la demande
 * depuis le même instantané que la page (aucun fichier stocké : le jeton suffit).
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token || token.length < 20) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')
  const rapport = await reportByToken(event, token)
  const pdf = rapportPdf(rapport, useRuntimeConfig().public.appBaseUrl)
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="${nomFichierPdf(rapport)}"`)
  setHeader(event, 'Cache-Control', 'private, no-store')
  return pdf
})
