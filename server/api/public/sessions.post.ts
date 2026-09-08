import { z } from 'zod'

const Body = z
  .object({
    landingUrl: z.string().url().max(2048).optional(),
    referrer: z.string().max(2048).optional(),
    utmSource: z.string().max(255).optional(),
    utmMedium: z.string().max(255).optional(),
    utmCampaign: z.string().max(255).optional(),
    utmTerm: z.string().max(255).optional(),
    utmContent: z.string().max(255).optional(),
    fbclid: z.string().max(512).optional(),
    gclid: z.string().max(512).optional(),
  })
  .strict()
  .default({})

/**
 * POST /api/public/sessions — crée ou reprend la session anonyme (cookie `radar_sid`, 7 j)
 * et enregistre l'acquisition first-touch à la création seulement.
 */
export default defineEventHandler(async (event) => {
  const raw = await readBody(event).catch(() => ({}))
  const parsed = Body.safeParse(raw ?? {})
  if (!parsed.success) {
    throw apiError(event, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Corps invalide.')
  }

  const before = await currentSession(event)
  const session = await ensureSession(event, parsed.data)

  return {
    resumed: Boolean(before),
    expiresAt: session.expires_at,
    correlation_id: event.context.correlationId,
  }
})
