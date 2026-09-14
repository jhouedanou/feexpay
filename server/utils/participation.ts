import type { H3Event } from 'h3'

export type DiagnosticType = 'dirigeant' | 'rayonnement'
export type ParticipationStatus = 'in_progress' | 'completed' | 'abandoned'

/** Nombre de questions attendu par diagnostic (matrice V2.1). */
export const QUESTION_COUNT: Record<DiagnosticType, number> = {
  dirigeant: 14,
  rayonnement: 7,
}

export type ParticipationRow = {
  id: string
  session_id: string
  diagnostic_type: DiagnosticType
  version_id: string
  version: string
  status: ParticipationStatus
  started_at: Date
  completed_at: Date | null
}

/** Version publiée courante, sinon VERSION_INACTIVE. */
export async function publishedVersion(event: H3Event) {
  const { rows } = await db().query<{ id: string; version: string }>(
    `select id, version from scoring_version where status = 'published'
      order by published_at desc limit 1`
  )
  const row = rows[0]
  if (!row) throw apiError(event, 'VERSION_INACTIVE', 'Aucune version de scoring publiée.')
  return row
}

/**
 * Participation désignée par son jeton public, restreinte à la session courante :
 * un jeton volé sans le cookie ne donne rien. Réponse 404 indifférenciée
 * (jeton inconnu / autre session), pour ne pas confirmer l'existence d'un jeton.
 */
export async function participationByToken(
  event: H3Event,
  token: string,
  sessionId: string
): Promise<ParticipationRow> {
  const { rows } = await db().query<ParticipationRow>(
    `select p.id, p.session_id, p.diagnostic_type, p.version_id, v.version,
            p.status, p.started_at, p.completed_at
       from participation p
       join scoring_version v on v.id = p.version_id
      where p.token_hash = $1 and p.session_id = $2`,
    [hashToken(token), sessionId]
  )
  const row = rows[0]
  if (!row) throw apiError(event, 'NOT_FOUND', 'Participation introuvable.')
  return row
}

export type PublicQuestion = {
  code: string
  ordre: number
  texte: string
  options: { code: string; lettre: string; texte: string }[]
}

/**
 * Questions et options de la version de la participation.
 * `option.mapping` (dimensions, points, poids, constats) n'est JAMAIS exposé :
 * le barème reste serveur (CDC — aucun score interne côté client).
 */
export async function questionsFor(
  versionId: string,
  type: DiagnosticType
): Promise<PublicQuestion[]> {
  const { rows } = await db().query<{
    code: string
    ordre: number
    texte: string
    options: { code: string; lettre: string; texte: string }[]
  }>(
    `select q.code, q.ordre, q.texte,
            coalesce(
              jsonb_agg(jsonb_build_object('code', o.code, 'lettre', o.lettre, 'texte', o.texte)
                        order by o.lettre)
              filter (where o.id is not null), '[]'::jsonb) as options
       from question q
       left join "option" o on o.question_id = q.id
      where q.version_id = $1 and q.diagnostic_type = $2
      group by q.id, q.code, q.ordre, q.texte
      order by q.ordre`,
    [versionId, type]
  )
  return rows
}

/** Réponses enregistrées : code question -> lettre (forme attendue par les écrans). */
export async function answersFor(participationId: string): Promise<Record<string, string>> {
  const { rows } = await answerRows(participationId)
  return Object.fromEntries(rows.map((r) => [r.code, r.lettre]))
}

/**
 * Réponses au format du moteur : code question -> code option (`{ Q1: 'Q1B' }`).
 * `Answers` de @radar/scoring attend le code complet, pas la lettre seule.
 */
export async function engineAnswers(participationId: string): Promise<Record<string, string>> {
  const { rows } = await answerRows(participationId)
  return Object.fromEntries(rows.map((r) => [r.code, r.optionCode]))
}

async function answerRows(participationId: string) {
  return db().query<{ code: string; lettre: string; optionCode: string }>(
    `select q.code, o.lettre, o.code as "optionCode"
       from answer a
       join question q on q.id = a.question_id
       join "option" o on o.id = a.option_id
      where a.participation_id = $1`,
    [participationId]
  )
}

/** Index de la première question sans réponse (= reprise), ou total si complet. */
export function currentIndex(questions: PublicQuestion[], answers: Record<string, string>): number {
  const i = questions.findIndex((q) => !answers[q.code])
  return i === -1 ? questions.length : i
}
