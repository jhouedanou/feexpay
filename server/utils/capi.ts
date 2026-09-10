import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import { reglages } from './settings'
import { journaliserEvenement, marquerEchec, marquerEnvoye } from './outbox'

/**
 * Meta Conversions API (annexe 04 §6) : Lead et quiz_completed, envoyés côté serveur
 * avec l'`event_id` que le Pixel a utilisé, pour la déduplication. Régie par la politique
 * de confidentialité, pas par un commutateur de cookies ; l'appel n'a lieu que si le
 * navigateur a transmis un `event_id`, c'est-à-dire si le Pixel a pu le poser.
 * Jamais bloquant : une erreur est journalisée, pas remontée.
 *
 * L'envoi passe par `tracking_event_outbox` (PLAN.md §8) : un `event_id` déjà journalisé
 * ne repart pas, ce qui neutralise les doubles soumissions et les rejeux.
 */
export async function envoyerCapi(
  event: H3Event,
  nom: 'Lead' | 'quiz_completed',
  eventId: string | undefined,
  userData: { email?: string; phone?: string } = {},
  custom: Record<string, unknown> = {},
) {
  if (!eventId) return
  const ligne = await journaliserEvenement(nom, eventId, { custom }, ['meta_capi'])
  if (!ligne) return
  try {
    const r = await reglages()
    const pixel = r.meta_pixel_id
    const token = r.meta_capi_access_token
    if (r.tracking_enabled !== 'true') return marquerEchec(ligne, 'tracking désactivé')
    if (!pixel || !token) return marquerEchec(ligne, 'meta_pixel_id ou meta_capi_access_token absent')
    const sha = (v: string) => createHash('sha256').update(v.trim().toLowerCase()).digest('hex')
    const ip = getRequestIP(event, { xForwardedFor: true })
    const ua = getRequestHeader(event, 'user-agent')
    const body: Record<string, unknown> = {
      data: [
        {
          event_name: nom,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          event_source_url: getRequestHeader(event, 'referer') ?? useRuntimeConfig().public.appBaseUrl,
          user_data: {
            ...(ip ? { client_ip_address: ip } : {}),
            ...(ua ? { client_user_agent: ua } : {}),
            ...(userData.email ? { em: [sha(userData.email)] } : {}),
            ...(userData.phone ? { ph: [sha(userData.phone.replace(/\D/g, ''))] } : {}),
          },
          custom_data: custom,
        },
      ],
    }
    if (r.meta_capi_test_event_code) body.test_event_code = r.meta_capi_test_event_code
    const res = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) return marquerEnvoye(ligne)
    const detail = `${res.status} ${(await res.text()).slice(0, 200)}`
    console.warn('[capi]', nom, detail)
    await marquerEchec(ligne, detail)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.warn('[capi]', nom, message)
    await marquerEchec(ligne, message)
  }
}
