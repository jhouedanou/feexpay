import { requireAdmin } from '../../../utils/admin-auth'
import { chargerModele, CLES_MODELES, DEFAUTS_MODELES, DESCRIPTION_CHAMPS, DESCRIPTION_MODELES, VARIABLES_MODELE, CHAMPS_MODELE } from '../../../utils/modeles-email'

/**
 * GET /api/admin/rapports/modeles — les trois modèles d'email de rapport, avec leurs textes
 * actuels, leurs textes d'origine, et qui les a modifiés. Rôle Commercial pour lire ; la
 * modification exige Administrateur, voir la route PUT.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'commercial')
  const modeles = await Promise.all(
    CLES_MODELES.map(async (cle) => {
      const m = await chargerModele(cle)
      return {
        cle,
        ...DESCRIPTION_MODELES[cle],
        champs: m.champs,
        defauts: DEFAUTS_MODELES[cle],
        personnalise: m.personnalise,
        modifieLe: m.modifieLe,
        modifiePar: m.modifiePar,
      }
    }),
  )
  return {
    modeles,
    champs: CHAMPS_MODELE.map((cle) => ({ cle, ...DESCRIPTION_CHAMPS[cle] })),
    variables: VARIABLES_MODELE,
    correlation_id: event.context.correlationId,
  }
})
