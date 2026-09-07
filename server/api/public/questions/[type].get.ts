import { options, questionsOf, VERSION } from '@radar/scoring'

/** Questions + options publiques (textes seulement ; aucun mapping, aucun constat). */
export default defineEventHandler((event) => {
  const type = getRouterParam(event, 'type')
  if (type !== 'dirigeant' && type !== 'rayonnement') throw apiError(event, 'NOT_FOUND')
  return {
    version: VERSION,
    type,
    questions: questionsOf(type).map((q) => ({
      code: q.code,
      ordre: q.ordre,
      texte: q.texte,
      options: options
        .filter((o) => o.questionCode === q.code)
        .map((o) => ({ code: o.code, lettre: o.lettre, texte: o.texte })),
    })),
  }
})
