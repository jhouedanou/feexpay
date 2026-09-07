import { z } from 'zod'
import { schema, useDb } from '../../utils/db'
import { createAnonSession, getAnonSession } from '../../utils/session'

const Body = z.object({
  landing_url: z.string().max(2048).optional(),
  referrer: z.string().max(2048).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  fbclid: z.string().max(300).optional(),
  gclid: z.string().max(300).optional(),
  device: z.string().max(50).optional(),
})

/** Crée ou reprend la session anonyme (cookie 7 j) ; acquisition first-touch une seule fois. */
export default defineEventHandler(async (event) => {
  const parsed = Body.safeParse((await readBody(event).catch(() => ({}))) ?? {})
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', undefined, parsed.error.flatten())
  const existing = await getAnonSession(event)
  if (existing) return { resumed: true, expires_at: existing.expiresAt }

  const s = await createAnonSession(event)
  const b = parsed.data
  await useDb()
    .insert(schema.acquisition)
    .values({
      sessionId: s.id,
      landingUrl: b.landing_url,
      referrer: b.referrer,
      utmSource: b.utm_source,
      utmMedium: b.utm_medium,
      utmCampaign: b.utm_campaign,
      utmTerm: b.utm_term,
      utmContent: b.utm_content,
      fbclid: b.fbclid,
      gclid: b.gclid,
      device: b.device,
    })
    .onConflictDoNothing()
  return { resumed: false, expires_at: s.expiresAt }
})
