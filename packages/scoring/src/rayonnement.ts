import { constants, resolveAnswers } from './data'
import type { Answers, RayonnementResult } from './types'

export function scoreRayonnement(answers: Answers): RayonnementResult {
  const chosen = resolveAnswers('rayonnement', answers)
  const pts = (q: string) => (chosen.find((o) => o.questionCode === q)!.points ?? 0) / 3 * 100
  const c = constants.rayonnement
  const dims = {
    notoriete: pts('R1'),
    lectureConcurrentielle: pts('R2'),
    differenciation: pts('R4'),
    digital: pts('R5') * c.digital.r5 + pts('R6') * c.digital.r6,
    empreinte: pts('R7'),
  }
  const score =
    dims.notoriete * c.poids.notoriete +
    dims.lectureConcurrentielle * c.poids.lectureConcurrentielle +
    dims.differenciation * c.poids.differenciation +
    dims.digital * c.poids.digital +
    dims.empreinte * c.poids.empreinte

  const levels = [...c.levels].sort((a, b) => b.min - a.min)
  const level = levels.find((l) => score >= l.min)!
  const upper = levels.filter((l) => l.min > score).sort((a, b) => a.min - b.min)[0]
  const vals = Object.values(dims)
  let nuance: string | null = null
  if (upper && upper.min - score <= c.nuance.marge && vals.filter((v) => v >= upper.min).length >= c.nuance.dimsMin && Math.min(...vals) >= c.nuance.minDim) {
    nuance = c.nuance.libelle
  }
  const r3 = chosen.find((o) => o.questionCode === 'R3')!
  return {
    dims,
    score,
    scoreAffiche: Math.round(score),
    niveau: level.niveau,
    meteo: level.meteo,
    nuance,
    differenciation: r3.tags[0]!.valeur,
  }
}
