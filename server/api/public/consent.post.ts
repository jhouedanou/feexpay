import { z } from 'zod'

export const POLICY_VERSION = '2026-09-07'
export const TEXT_VERSION_COOKIES = 'c01-c02-v1.2'

const Body = z
  .object({
    analytics: z.boolean(),
    ads: z.boolean(),
    source: z.enum(['c01', 'c02', 'footer']),
  })
  .strict()

/**
 * POST /api/public/consent — preuve du choix de cookies (C01/C02). Le choix lui-même
 * est tenu par le navigateur ; ici on garde l'horodatage, la version du texte, la portée
 * et l'origine, rattachés à la session anonyme (créée si besoin).
 */
export default defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Choix invalide.')
  const { analytics, ads, source } = parsed.data
  const session = await ensureSession(event)
  const statut = analytics && ads ? 'accepte' : !analytics && !ads ? 'refuse' : 'partiel'
  await db().query(
    `insert into consent_record (session_id, type, statut, policy_version, text_version, source, details)
     values ($1, 'cookies', $2, $3, $4, $5, $6)`,
    [session.id, statut, POLICY_VERSION, TEXT_VERSION_COOKIES, source, JSON.stringify({ analytics, ads })],
  )
  return { ok: true, statut }
})
