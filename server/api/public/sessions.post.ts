import { z } from 'zod'

// Le client envoie les clés en snake_case (noms du plan de tracking) ; on accepte
// les deux graphies plutôt que d'imposer une convention à la couche d'acquisition.
const Body = z
  .object({
    landingUrl: z.string().url().max(2048).optional(),
    landing_url: z.string().url().max(2048).optional(),
    referrer: z.string().max(2048).optional(),
    utmSource: z.string().max(255).optional(),
    utm_source: z.string().max(255).optional(),
    utmMedium: z.string().max(255).optional(),
    utm_medium: z.string().max(255).optional(),
    utmCampaign: z.string().max(255).optional(),
    utm_campaign: z.string().max(255).optional(),
    utmTerm: z.string().max(255).optional(),
    utm_term: z.string().max(255).optional(),
    utmContent: z.string().max(255).optional(),
    utm_content: z.string().max(255).optional(),
    fbclid: z.string().max(512).optional(),
    gclid: z.string().max(512).optional(),
    device: z.enum(['mobile', 'tablet', 'desktop', 'unknown']).optional(),
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

  const b = parsed.data
  const before = await currentSession(event)
  const session = await ensureSession(event, {
    landingUrl: b.landingUrl ?? b.landing_url,
    referrer: b.referrer,
    utmSource: b.utmSource ?? b.utm_source,
    utmMedium: b.utmMedium ?? b.utm_medium,
    utmCampaign: b.utmCampaign ?? b.utm_campaign,
    utmTerm: b.utmTerm ?? b.utm_term,
    utmContent: b.utmContent ?? b.utm_content,
    fbclid: b.fbclid,
    gclid: b.gclid,
    device: b.device,
  })

  return {
    resumed: Boolean(before),
    expiresAt: session.expires_at,
    correlation_id: event.context.correlationId,
  }
})
