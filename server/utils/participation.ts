import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { schema, useDb } from './db'
import { TOKEN_RE, hashToken } from './tokens'

export async function requireParticipation(event: H3Event) {
  const token = getRouterParam(event, 'token') ?? ''
  if (!TOKEN_RE.test(token)) throw apiError(event, 'NOT_FOUND')
  const db = useDb()
  const [p] = await db.select().from(schema.participation).where(eq(schema.participation.tokenHash, hashToken(token))).limit(1)
  if (!p) throw apiError(event, 'NOT_FOUND')
  return p
}

export async function publishedVersion(event: H3Event) {
  const db = useDb()
  const [v] = await db.select().from(schema.scoringVersion).where(eq(schema.scoringVersion.status, 'published')).limit(1)
  if (!v) throw apiError(event, 'VERSION_INACTIVE')
  return v
}

/** Réponses d'une participation sous forme { Q1: 'B', ... } */
export async function loadAnswers(participationId: string) {
  const db = useDb()
  const rows = await db
    .select({ q: schema.question.code, l: schema.option.lettre })
    .from(schema.answer)
    .innerJoin(schema.question, eq(schema.answer.questionId, schema.question.id))
    .innerJoin(schema.option, eq(schema.answer.optionId, schema.option.id))
    .where(eq(schema.answer.participationId, participationId))
  return Object.fromEntries(rows.map((r) => [r.q, r.l as 'A' | 'B' | 'C' | 'D']))
}
