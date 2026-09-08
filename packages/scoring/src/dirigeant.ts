/**
 * Diagnostic « Profil du dirigeant » (Q1–Q14) — PLAN §5.1.
 * Chaque option apporte +2 à sa dimension principale et +1 à sa dimension secondaire.
 * Le pilotage interne n'est jamais exposé au public (P08).
 */
import { validate } from './answers'
import { ScoringError } from './errors'
import type {
  Affinity,
  Answers,
  Archetype,
  ArchetypeCode,
  ArchetypeData,
  Dimension,
  DirigeantResult,
  OptionCode,
  OptionData,
  Pilotage,
  TieBreak,
  TieBreakStep,
} from './types'
import { level, round2 } from './utils'

const DIMENSIONS: Dimension[] = ['VIS', 'STR', 'EXE', 'ORG', 'INF', 'AUD', 'ADA', 'TRA']

/** Points bruts par dimension : +2 sur `dim2`, +1 sur `dim1`. */
function rawScores(options: OptionData[]): Record<Dimension, number> {
  const raw = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<Dimension, number>
  for (const o of options) {
    if (!o.dim2 || !o.dim1) {
      throw new ScoringError('INVALID_ANSWER', `Option ${o.code} sans mapping de dimensions`, { option: o.code })
    }
    raw[o.dim2 as Dimension] += 2
    raw[o.dim1 as Dimension] += 1
  }
  return raw
}

/** Nombre de « +2 » obtenus par dimension — 2e critère de départage. */
function plus2Counts(options: OptionData[]): Record<Dimension, number> {
  const counts = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<Dimension, number>
  for (const o of options) counts[o.dim2 as Dimension] += 1
  return counts
}

/**
 * Départage des archétypes à égalité d'affinité arrondie (PLAN §5.1, défaut §10.1 :
 * dimension centrale, comparaison après arrondi). Journalisé dans `tie_break`.
 */
function breakTie(
  candidates: ArchetypeData[],
  norm: Record<Dimension, number>,
  raw: Record<Dimension, number>,
  plus2: Record<Dimension, number>,
  ordreTechnique: ArchetypeCode[],
): { winner: ArchetypeData; steps: TieBreakStep[] } {
  const criteria: { regle: string; value: (a: ArchetypeData) => number; direction: 'desc' | 'asc' }[] = [
    { regle: 'normCentrale', value: (a) => norm[a.dims[0]], direction: 'desc' },
    { regle: 'plus2Centrale', value: (a) => plus2[a.dims[0]], direction: 'desc' },
    { regle: 'sommeBrute', value: (a) => a.dims.reduce((s, d) => s + raw[d], 0), direction: 'desc' },
    { regle: 'ordreTechnique', value: (a) => ordreTechnique.indexOf(a.code), direction: 'asc' },
  ]

  const steps: TieBreakStep[] = []
  let pool = candidates
  for (const c of criteria) {
    const scored = pool.map((a) => ({ archetype: a, valeur: c.value(a) }))
    const best = c.direction === 'desc' ? Math.max(...scored.map((s) => s.valeur)) : Math.min(...scored.map((s) => s.valeur))
    const kept = scored.filter((s) => s.valeur === best)
    steps.push({
      regle: c.regle,
      candidats: scored.map((s) => ({ code: s.archetype.code, valeur: s.valeur })),
      gagnant: kept[0]!.archetype.code,
    })
    pool = kept.map((s) => s.archetype)
    if (pool.length === 1) break
  }
  // L'ordre technique est total : `pool` contient exactement un archétype ici.
  return { winner: pool[0]!, steps }
}

/** Pilotage interne : Σ(points/3 × poids) / Σ(poids applicables) × 100. Q9D est exclu du dénominateur. */
function computePilotage(options: OptionData[], levels: { min: number; niveau: string; lecture: string }[]): Pilotage {
  let numerateur = 0
  let denominateur = 0
  const exclues: OptionCode[] = []
  for (const o of options) {
    const poids = o.poids ?? 0
    if (poids === 0) continue
    if (!o.applicable || o.points === null) {
      exclues.push(o.code)
      continue
    }
    numerateur += (o.points / 3) * poids
    denominateur += poids
  }
  if (denominateur === 0) {
    throw new ScoringError('INVALID_ANSWER', 'Aucune question de pilotage applicable', { exclues })
  }
  const score = (numerateur / denominateur) * 100
  const palier = level(levels, score)
  return { score, niveau: palier.niveau, lecture: palier.lecture, numerateur, denominateur, exclues }
}

function toArchetype(data: ArchetypeData, affinite: number): Archetype {
  return {
    code: data.code,
    inspirePar: data.inspirePar,
    dims: data.dims,
    poids: data.poids,
    traits: data.traits,
    forces: data.forces,
    risque: data.risque,
    affinite,
  }
}

/**
 * Calcule le profil du dirigeant. Déterministe : mêmes réponses + même version => même résultat.
 * @throws ScoringError INCOMPLETE_PARTICIPATION si les 14 réponses ne sont pas toutes présentes.
 */
export function scoreDirigeant(answers: Answers, version?: string): DirigeantResult {
  const { options, version: v } = validate('dirigeant', answers, version)
  const { max, ordreTechnique, secondaire: seuils, pilotageLevels } = v.constants.dirigeant

  const raw = rawScores(options)
  const plus2 = plus2Counts(options)
  const norm = Object.fromEntries(DIMENSIONS.map((d) => [d, (raw[d] / max[d]) * 100])) as Record<Dimension, number>

  const byCode = new Map(v.archetypes.map((a) => [a.code, a]))
  const affinities: Affinity[] = v.archetypes.map((a) => {
    const exact = a.dims.reduce((sum, d, i) => sum + a.poids[i]! * norm[d], 0)
    return { code: a.code, exact, value: round2(exact) }
  })

  // Classement : affinité arrondie décroissante, puis départage déterministe.
  const ranked = [...affinities].sort((x, y) => {
    if (y.value !== x.value) return y.value - x.value
    const winner = breakTie([byCode.get(x.code)!, byCode.get(y.code)!], norm, raw, plus2, ordreTechnique).winner
    return winner.code === x.code ? -1 : 1
  })

  const top = ranked[0]!
  const exAequo = affinities.filter((a) => a.value === top.value)
  let tieBreak: TieBreak | null = null
  if (exAequo.length > 1) {
    const { steps } = breakTie(
      exAequo.map((a) => byCode.get(a.code)!),
      norm,
      raw,
      plus2,
      ordreTechnique,
    )
    tieBreak = { exAequo: exAequo.map((a) => a.code), affinite: top.value, etapes: steps }
  }

  const principal = toArchetype(byCode.get(top.code)!, top.value)

  // Secondaire : proche mais distinct du principal, sinon null.
  const challenger = ranked[1]!
  const eligible =
    challenger.value >= seuils.minAffinite &&
    challenger.value >= seuils.ratioMin * top.value &&
    top.value - challenger.value <= seuils.ecartMax
  const secondaire = eligible ? toArchetype(byCode.get(challenger.code)!, challenger.value) : null

  return {
    type: 'dirigeant',
    version: v.version,
    raw,
    norm,
    affinities: ranked,
    principal,
    secondaire,
    tieBreak,
    pilotage: computePilotage(options, pilotageLevels),
  }
}
