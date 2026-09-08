/**
 * Diagnostic « Rayonnement de l'entreprise » (R1–R7) — PLAN §5.2.
 * R3 n'est pas scoré : c'est un tag de différenciation déclarée.
 * Les seuils s'appliquent au score exact ; seul l'affichage est arrondi à l'entier.
 */
import { validate } from './answers'
import { ScoringError } from './errors'
import type { Answers, OptionData, RayonnementDimension, RayonnementResult } from './types'
import { level } from './utils'

/** Points 0–3 -> score 0–100 de la dimension. */
function pct(option: OptionData): number {
  if (option.points === null) {
    throw new ScoringError('INVALID_ANSWER', `Option ${option.code} sans points`, { option: option.code })
  }
  return (option.points / 3) * 100
}

/**
 * Calcule le rayonnement. Déterministe.
 * @throws ScoringError INCOMPLETE_PARTICIPATION si les 7 réponses ne sont pas toutes présentes.
 */
export function scoreRayonnement(answers: Answers, version?: string): RayonnementResult {
  const { byQuestion, version: v } = validate('rayonnement', answers, version)
  const { poids, digital, levels, nuance } = v.constants.rayonnement
  const get = (q: string): OptionData => byQuestion.get(q)!

  const [r1, r2, r3, r4, r5, r6, r7] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'].map(get)

  const dimensions: RayonnementDimension[] = [
    { cle: 'notoriete', nom: r1!.dimension!, score: pct(r1!), poids: poids.notoriete, sources: [r1!.code] },
    {
      cle: 'lectureConcurrentielle',
      nom: r2!.dimension!,
      score: pct(r2!),
      poids: poids.lectureConcurrentielle,
      sources: [r2!.code],
    },
    { cle: 'differenciation', nom: r4!.dimension!, score: pct(r4!), poids: poids.differenciation, sources: [r4!.code] },
    {
      cle: 'digital',
      nom: 'Digital',
      score: pct(r5!) * digital.r5 + pct(r6!) * digital.r6,
      poids: poids.digital,
      sources: [r5!.code, r6!.code],
    },
    { cle: 'empreinte', nom: r7!.dimension!, score: pct(r7!), poids: poids.empreinte, sources: [r7!.code] },
  ]

  const score = dimensions.reduce((s, d) => s + d.score * d.poids, 0)
  const palier = level(levels, score)

  // « avec potentiel d'éclaircie » : le palier supérieur est à portée et déjà atteint sur au moins 2 dimensions,
  // sans dimension effondrée.
  const superieurs = levels.filter((l) => l.min > palier.min).map((l) => l.min)
  const seuilSup = superieurs.length > 0 ? Math.min(...superieurs) : null
  const scoresDims = dimensions.map((d) => d.score)
  const applicable =
    seuilSup !== null &&
    score < 80 &&
    seuilSup - score <= nuance.marge &&
    scoresDims.filter((s) => s >= seuilSup).length >= nuance.dimsMin &&
    Math.min(...scoresDims) >= nuance.minDim

  const tag = r3!.tags[0]

  return {
    type: 'rayonnement',
    version: v.version,
    dimensions,
    score,
    scoreAffiche: Math.round(score),
    niveau: palier.niveau,
    meteo: palier.meteo,
    lecture: palier.lecture,
    nuance: applicable,
    niveauAffiche: applicable ? `${palier.niveau} ${nuance.libelle}` : palier.niveau,
    differenciationDeclaree: {
      code: r3!.code,
      tag: tag?.tag ?? '',
      valeur: tag?.valeur ?? '',
      texte: r3!.texte,
    },
  }
}
