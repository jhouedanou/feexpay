/**
 * Bibliothèque de constats et règles combinées — PLAN §5.4, annexe §11.
 * Alimente la fiche commerciale (admin uniquement). Aucune recommandation produit :
 * pas de champ product_*, pas de mapping constat -> offre (CDC).
 */
import { validate } from './answers'
import { getVersion } from './data'
import type {
  Answers,
  Declared,
  Difficulty,
  Fact,
  Force,
  Hypothesis,
  InsightSnapshot,
  OptionCode,
  OptionData,
  Proof,
  QuestionCode,
} from './types'

export interface InsightInput {
  dirigeant?: Answers
  rayonnement?: Answers
  /** Horodatage des réponses (code question -> ISO 8601), pour les preuves. Le moteur ne lit jamais l'horloge. */
  answeredAt?: Record<QuestionCode, string>
  version?: string
}

/** Question déclarative -> clé de la section « Infos déclarées ». */
const DECLARED_KEYS: Record<QuestionCode, Declared['cle']> = {
  Q11: 'canal',
  Q13: 'condition',
  Q14: 'besoin',
  R3: 'differenciation',
}

/**
 * Construit le snapshot d'insights. Au moins un des deux diagnostics doit être fourni ;
 * les règles combinées qui référencent un diagnostic absent ne se déclenchent pas.
 */
export function buildInsights(input: InsightInput): InsightSnapshot {
  const v = getVersion(input.version)
  if (!input.dirigeant && !input.rayonnement) {
    throw new Error('INSIGHTS_EMPTY: aucun diagnostic fourni')
  }

  const selected: OptionData[] = []
  if (input.dirigeant) selected.push(...validate('dirigeant', input.dirigeant, input.version).options)
  if (input.rayonnement) selected.push(...validate('rayonnement', input.rayonnement, input.version).options)

  // Index d'ordre global : Q1..Q14 puis R1..R7.
  const order = [...v.questionCodes.dirigeant, ...v.questionCodes.rayonnement]
  const rank = new Map(order.map((q, i) => [q, i]))
  const texte = (q: QuestionCode) => v.questionByCode.get(q)?.texte ?? ''

  const base = (o: OptionData) => ({
    code: o.code,
    questionCode: o.questionCode,
    question: texte(o.questionCode),
    reponse: o.texte,
  })

  const facts: Fact[] = selected
    .filter((o) => o.constat)
    .map((o) => ({
      ...base(o),
      dimension: o.constat!.dimension,
      nature: o.constat!.nature,
      gravite: o.constat!.gravite,
      niveau: o.constat!.niveau,
      factuel: o.constat!.factuel,
      usage: o.constat!.usage,
    }))

  const difficulties: Difficulty[] = selected
    .filter((o) => o.constat && o.constat.gravite > 0 && o.constat.difficulte !== '')
    .map((o) => ({
      ...base(o),
      dimension: o.constat!.dimension,
      nature: o.constat!.nature,
      gravite: o.constat!.gravite,
      niveau: o.constat!.niveau,
      factuel: o.constat!.factuel,
      usage: o.constat!.usage,
      difficulte: o.constat!.difficulte,
      relance: o.constat!.relance,
    }))
    .sort((a, b) => b.gravite - a.gravite || rank.get(a.questionCode)! - rank.get(b.questionCode)!)
    .slice(0, v.constants.insights.maxDifficultes)

  const forces: Force[] = selected
    .filter((o) => o.constat?.nature === 'Force')
    .sort((a, b) => rank.get(a.questionCode)! - rank.get(b.questionCode)!)
    .map((o) => ({
      ...base(o),
      dimension: o.constat!.dimension,
      factuel: o.constat!.factuel,
      usage: o.constat!.usage,
    }))
    .slice(0, v.constants.insights.maxForces)

  const declared: Declared[] = selected
    .filter((o) => DECLARED_KEYS[o.questionCode])
    .sort((a, b) => rank.get(a.questionCode)! - rank.get(b.questionCode)!)
    .map((o) => ({
      ...base(o),
      cle: DECLARED_KEYS[o.questionCode]!,
      tag: o.tags[0]?.tag ?? '',
      valeur: o.tags[0]?.valeur ?? '',
    }))

  const chosen = new Set<OptionCode>(selected.map((o) => o.code))
  const hypotheses: Hypothesis[] = v.combinedRules
    .filter((r) => r.groups.length > 0 && r.groups.every((g) => g.some((code) => chosen.has(code))))
    .map((r) => ({
      id: r.id,
      theme: r.theme,
      gravite: r.gravite,
      condition: r.condition,
      signaux: r.signaux,
      hypothese: r.hypothese,
      relance: r.relance,
      declencheurs: r.groups.map((g) => g.find((code) => chosen.has(code))!),
    }))
    .sort((a, b) => b.gravite - a.gravite || a.id.localeCompare(b.id))
    .slice(0, v.constants.insights.maxHypotheses)

  const proofs: Proof[] = selected.map((o) => ({
    ...base(o),
    diagnostic: v.questionByCode.get(o.questionCode)!.type,
    version: v.version,
    answeredAt: input.answeredAt?.[o.questionCode] ?? null,
  }))

  return { version: v.version, facts, difficulties, forces, declared, hypotheses, proofs }
}
