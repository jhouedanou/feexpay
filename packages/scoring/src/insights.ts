import { VERSION, combinedRules, questions, resolveAnswers } from './data'
import type { Answers, HypothesisItem, InsightItem, Insights, Option, Proof } from './types'

const DECLARED = new Set(['Q11', 'Q13', 'Q14', 'R3'])

/**
 * Fiche commerciale. Chaque diagnostic est optionnel (fiche partielle si un seul parcours).
 * Interdit : toute donnée produit (déjà exclue à l'extraction).
 */
export function buildInsights(dirigeant: Answers | null, rayonnement: Answers | null, date = new Date().toISOString()): Insights {
  const chosen: Option[] = [
    ...(dirigeant ? resolveAnswers('dirigeant', dirigeant) : []),
    ...(rayonnement ? resolveAnswers('rayonnement', rayonnement) : []),
  ]
  const qText = (code: string) => questions.find((q) => q.code === code)!.texte
  const qIndex = (code: string) => questions.findIndex((q) => q.code === code)
  const item = (o: Option, texte: string): InsightItem => ({
    code: o.code,
    question: qText(o.questionCode),
    option: o.texte,
    dimension: o.constat!.dimension,
    nature: o.constat!.nature,
    gravite: o.constat!.gravite,
    texte,
  })
  const withC = chosen.filter((o) => o.constat)
  const { maxDifficultes, maxForces, maxHypotheses } = { maxDifficultes: 6, maxForces: 4, maxHypotheses: 6 }

  const difficulties = withC
    .filter((o) => o.constat!.gravite > 0 && o.constat!.difficulte !== '')
    .sort((a, b) => b.constat!.gravite - a.constat!.gravite || qIndex(a.questionCode) - qIndex(b.questionCode))
    .slice(0, maxDifficultes)
    .map((o) => item(o, o.constat!.difficulte))

  const forces = withC
    .filter((o) => o.constat!.nature === 'Force')
    .sort((a, b) => qIndex(a.questionCode) - qIndex(b.questionCode))
    .slice(0, maxForces)
    .map((o) => item(o, o.constat!.factuel))

  const facts = withC.filter((o) => DECLARED.has(o.questionCode)).map((o) => item(o, o.constat!.factuel))

  const codes = new Set(chosen.map((o) => o.code))
  const hypotheses: HypothesisItem[] = combinedRules
    .filter((r) => r.groups.every((g) => g.some((c) => codes.has(c))))
    .sort((a, b) => b.gravite - a.gravite || a.id.localeCompare(b.id))
    .slice(0, maxHypotheses)
    .map((r) => ({
      id: r.id,
      theme: r.theme,
      gravite: r.gravite,
      signaux: r.signaux,
      hypothese: r.hypothese,
      relance: r.relance,
      codes: r.groups.flat().filter((c) => codes.has(c)),
    }))

  const proofs: Proof[] = chosen.map((o) => ({ code: o.code, question: qText(o.questionCode), option: o.texte, version: VERSION, date }))

  return { facts, difficulties, forces, hypotheses, proofs }
}
