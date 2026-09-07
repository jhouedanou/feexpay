import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDb } from '../../utils/db'
import { publishedVersion } from '../../utils/participation'
import { requireAnonSession } from '../../utils/session'
import { hashToken, newToken } from '../../utils/tokens'

const Body = z.object({ type: z.enum(['dirigeant', 'rayonnement']) })

/** Crée une participation (ou reprend celle en cours du même type sur la session). Retourne le jeton. */
export default defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', undefined, parsed.error.flatten())
  const session = await requireAnonSession(event)
  const version = await publishedVersion(event)
  const db = useDb()

  const [current] = await db
    .select()
    .from(schema.participation)
    .where(
      and(
        eq(schema.participation.sessionId, session.id),
        eq(schema.participation.diagnosticType, parsed.data.type),
        eq(schema.participation.status, 'in_progress'),
      ),
    )
    .limit(1)
  // Reprise : le jeton est hashé en base → on en régénère un pour la même participation.
  const token = newToken()
  if (current) {
    await db.update(schema.participation).set({ tokenHash: hashToken(token) }).where(eq(schema.participation.id, current.id))
    return { token, resumed: true, type: current.diagnosticType, version: version.version }
  }
  await db.insert(schema.participation).values({
    sessionId: session.id,
    diagnosticType: parsed.data.type,
    versionId: version.id,
    tokenHash: hashToken(token),
  })
  return { token, resumed: false, type: parsed.data.type, version: version.version }
})
