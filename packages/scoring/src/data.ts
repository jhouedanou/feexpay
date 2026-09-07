import questionsJson from './versions/v2.1/questions.json'
import optionsJson from './versions/v2.1/options.json'
import archetypesJson from './versions/v2.1/archetypes.json'
import rulesJson from './versions/v2.1/combined-rules.json'
import constantsJson from './versions/v2.1/constants.json'
import checksumJson from './versions/v2.1/checksum.json'
import type { Answers, Archetype, CombinedRule, DiagnosticType, Dim, Option, Question, ScoringError as _SE } from './types'
import { ScoringError } from './types'

export const VERSION = constantsJson.version
export const CHECKSUM = checksumJson.sha256
export const constants = constantsJson
export const questions = questionsJson as Question[]
export const options = optionsJson as Option[]
export const archetypes = archetypesJson as Archetype[]
export const combinedRules = rulesJson as CombinedRule[]
export const DIMS: Dim[] = ['VIS', 'STR', 'EXE', 'ORG', 'INF', 'AUD', 'ADA', 'TRA']

const byCode = new Map(options.map((o) => [o.code, o]))
export const optionByCode = (code: string): Option => {
  const o = byCode.get(code)
  if (!o) throw new ScoringError('INVALID_ANSWER', `Option inconnue : ${code}`)
  return o
}
export const questionsOf = (type: DiagnosticType) => questions.filter((q) => q.type === type).sort((a, b) => a.ordre - b.ordre)

/** Vérifie complétude + validité, retourne les options choisies dans l'ordre des questions. */
export function resolveAnswers(type: DiagnosticType, answers: Answers): Option[] {
  const qs = questionsOf(type)
  const missing = qs.filter((q) => !answers[q.code]).map((q) => q.code)
  if (missing.length) throw new ScoringError('INCOMPLETE_PARTICIPATION', `Réponses manquantes : ${missing.join(', ')}`)
  return qs.map((q) => optionByCode(`${q.code}${answers[q.code]}`))
}

/** "BCBADBADDBCADA" -> { Q1:'B', ... } ; "CCCCCCC" -> { R1:'C', ... } */
export function fromSequence(type: DiagnosticType, seq: string): Answers {
  const qs = questionsOf(type)
  if (seq.length !== qs.length) throw new ScoringError('INCOMPLETE_PARTICIPATION', `Séquence ${type} : ${qs.length} lettres attendues`)
  const out: Answers = {}
  qs.forEach((q, i) => {
    const l = seq[i]!.toUpperCase()
    if (!'ABCD'.includes(l)) throw new ScoringError('INVALID_ANSWER', `Lettre invalide : ${l}`)
    out[q.code] = l as Answers[string]
  })
  return out
}
