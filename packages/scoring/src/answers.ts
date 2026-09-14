/** Validation et normalisation des réponses avant tout calcul. Participation incomplète => aucun calcul (PLAN §5.5). */
import { getVersion, type ScoringVersion } from './data'
import { ScoringError } from './errors'
import type { Answers, DiagnosticType, OptionCode, OptionData, QuestionCode } from './types'

export interface ValidatedAnswers {
  type: DiagnosticType
  version: ScoringVersion
  /** Codes questions dans l'ordre de passation. */
  order: QuestionCode[]
  /** Options retenues, dans l'ordre de passation. */
  options: OptionData[]
  byQuestion: Map<QuestionCode, OptionData>
  byCode: Set<OptionCode>
}

/**
 * Vérifie que toutes les questions du diagnostic ont une réponse valide.
 * @throws ScoringError INCOMPLETE_PARTICIPATION / INVALID_ANSWER
 */
export function validate(type: DiagnosticType, answers: Answers, version?: string): ValidatedAnswers {
  const v = getVersion(version)
  const order = v.questionCodes[type]

  const unknown = Object.keys(answers).filter((q) => !order.includes(q))
  if (unknown.length > 0) {
    throw new ScoringError('INVALID_ANSWER', `Questions hors diagnostic « ${type} » : ${unknown.join(', ')}`, {
      type,
      unknown,
    })
  }

  const missing = order.filter((q) => !answers[q])
  if (missing.length > 0) {
    throw new ScoringError(
      'INCOMPLETE_PARTICIPATION',
      `Participation incomplète : ${missing.length} réponse(s) manquante(s) sur ${order.length}`,
      { type, missing, expected: order.length, received: order.length - missing.length },
    )
  }

  const options: OptionData[] = []
  for (const q of order) {
    // Le contrôle `missing` ci-dessus garantit une réponse pour chaque question de l'ordre.
    const code = answers[q]!
    const option = v.optionByCode.get(code)
    if (!option || option.questionCode !== q) {
      throw new ScoringError('INVALID_ANSWER', `Option « ${code} » invalide pour la question ${q}`, {
        question: q,
        option: code,
      })
    }
    options.push(option)
  }

  return {
    type,
    version: v,
    order,
    options,
    byQuestion: new Map(options.map((o) => [o.questionCode, o])),
    byCode: new Set(options.map((o) => o.code)),
  }
}

/**
 * Construit des réponses à partir des lettres, dans l'ordre de passation.
 * Utilitaire de test / de seed : `answersFromLetters('dirigeant', 'BCBADBADDBCADA')`.
 */
export function answersFromLetters(type: DiagnosticType, letters: string, version?: string): Answers {
  const v = getVersion(version)
  const order = v.questionCodes[type]
  const chars = [...letters.trim().toUpperCase()]
  if (chars.length !== order.length) {
    throw new ScoringError(
      'INCOMPLETE_PARTICIPATION',
      `${chars.length} lettre(s) fournie(s), ${order.length} attendues pour « ${type} »`,
      { type, expected: order.length, received: chars.length },
    )
  }
  const answers: Answers = {}
  order.forEach((q, i) => {
    answers[q] = `${q}${chars[i]}`
  })
  return answers
}
