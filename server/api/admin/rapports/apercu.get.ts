import { answersFromLetters, CAS_CONTROLE, crossReading, CURRENT_VERSION, scoreDirigeant, scoreRayonnement, toPublicDirigeant, toPublicRayonnement } from '@radar/scoring'
import { requireAdmin } from '../../../utils/admin-auth'
import { htmlRapport } from '../../../utils/email'
import type { RapportPublic } from '../../../utils/report'

/** GET /api/admin/rapports/apercu?modele=dirigeant|rayonnement|croise — A07 « Modèles d'email » : rendu HTML avec le cas de contrôle principal. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'commercial')
  const modele = String(getQuery(event).modele ?? 'croise')
  const cas = CAS_CONTROLE[0]
  const answersDir = answersFromLetters('dirigeant', cas.dir)
  const answersRay = answersFromLetters('rayonnement', cas.ray)
  const rDir = scoreDirigeant(answersDir)
  const rRay = scoreRayonnement(answersRay)
  const cr = crossReading(rDir, rRay)
  const rapport: RapportPublic = {
    id: 'apercu',
    status: 'ready',
    etabliLe: new Date().toISOString(),
    version: CURRENT_VERSION,
    contact: { prenom: 'Aya', nom: 'Konan', email: 'aya.konan@exemple.ci', entreprise: 'Atelier Nyamien' },
    dirigeant: modele === 'rayonnement' ? null : toPublicDirigeant(rDir),
    rayonnement: modele === 'dirigeant' ? null : toPublicRayonnement(rRay, answersRay),
    croisement:
      modele === 'croise'
        ? { code: cr.code, pilotage: Math.round(cr.pilotage), rayonnement: Math.round(cr.rayonnement), ecart: Math.round(cr.ecart), qualificatif: cr.qualificatif, ecartLecture: cr.ecartLecture, ecartAction: cr.ecartAction, lecture: cr.lecture, interpretation: cr.interpretation, formulation: cr.formulation, prioriteMarketing: cr.prioriteMarketing }
        : null,
  }
  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  return htmlRapport(rapport, `${useRuntimeConfig().public.appBaseUrl}/rapport/apercu`)
})
