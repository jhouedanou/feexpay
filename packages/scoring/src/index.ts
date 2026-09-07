export * from './types'
export { VERSION, CHECKSUM, constants, questions, options, archetypes, combinedRules, DIMS, questionsOf, optionByCode, fromSequence } from './data'
export { scoreDirigeant } from './dirigeant'
export { scoreRayonnement } from './rayonnement'
export { crossReading } from './cross'
export { buildInsights } from './insights'

import { scoreDirigeant } from './dirigeant'
import { scoreRayonnement } from './rayonnement'
import { crossReading } from './cross'
import type { Answers } from './types'

/** Résultat public dirigeant : sans pilotage, sans classement des 8. */
export function publicDirigeant(answers: Answers) {
  const r = scoreDirigeant(answers)
  const { pilotage: _p, affinites: _a, tieBreak: _t, ...pub } = r
  return pub
}

export function fullPair(dirigeant: Answers, rayonnement: Answers) {
  const d = scoreDirigeant(dirigeant)
  const r = scoreRayonnement(rayonnement)
  return { dirigeant: d, rayonnement: r, cross: crossReading(d.pilotage.score, r.score) }
}
