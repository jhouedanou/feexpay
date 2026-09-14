import { getVersion } from '@radar/scoring'

/**
 * GET /api/public/questions/{type} — questions et options de la version publiée,
 * servies depuis le moteur (données de version, pas de requête base).
 * Textes seulement : aucun mapping, aucun constat, aucun barème.
 */
export default defineEventHandler((event) => {
  const type = getRouterParam(event, 'type')
  if (type !== 'dirigeant' && type !== 'rayonnement') {
    throw apiError(event, 'NOT_FOUND', 'Type de diagnostic inconnu.')
  }

  const v = getVersion()
  const byQuestion = new Map<string, { code: string; lettre: string; texte: string }[]>()
  for (const o of v.options) {
    if (!byQuestion.has(o.questionCode)) byQuestion.set(o.questionCode, [])
    byQuestion.get(o.questionCode)!.push({ code: o.code, lettre: o.lettre, texte: o.texte })
  }

  return {
    version: v.version,
    type,
    questions: v.questions
      .filter((q) => q.type === type)
      .sort((a, b) => a.ordre - b.ordre)
      .map((q) => ({
        code: q.code,
        ordre: q.ordre,
        texte: q.texte,
        options: (byQuestion.get(q.code) ?? []).sort((a, b) => a.lettre.localeCompare(b.lettre)),
      })),
  }
})
