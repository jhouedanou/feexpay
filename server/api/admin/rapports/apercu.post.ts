import { z } from 'zod'
import { requireAdmin } from '../../../utils/admin-auth'
import { htmlRapport } from '../../../utils/email'
import { rapportDeControle } from '../../../utils/apercu-email'
import { CLES_MODELES, completerChamps, rendreTexte, variablesDuRapport } from '../../../utils/modeles-email'

const Body = z
  .object({
    modele: z.enum(CLES_MODELES as [string, ...string[]]),
    champs: z.record(z.string(), z.string().max(2000)).default({}),
  })
  .strict()

/**
 * POST /api/admin/rapports/apercu — aperçu d'un brouillon de modèle, sans rien enregistrer.
 * L'éditeur l'appelle à chaque modification pour montrer l'email tel qu'il partirait.
 * Rend le sujet et le HTML ; les champs vides reprennent le texte d'origine.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'commercial')
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Brouillon invalide.')
  const modele = parsed.data.modele as (typeof CLES_MODELES)[number]
  const champs = completerChamps(modele, parsed.data.champs)
  const rapport = rapportDeControle(modele)
  const lien = `${useRuntimeConfig().public.appBaseUrl}/rapport/apercu`
  return {
    sujet: rendreTexte(champs.sujet, variablesDuRapport(rapport, lien)),
    html: htmlRapport(rapport, lien, champs),
    correlation_id: event.context.correlationId,
  }
})
