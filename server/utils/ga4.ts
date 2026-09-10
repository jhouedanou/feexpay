import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import { reglages } from './settings'
import { journaliserEvenement, marquerEchec, marquerEnvoye } from './outbox'

/**
 * GA4 Measurement Protocol (PLAN.md §8). Deux événements ne peuvent pas partir du
 * navigateur parce qu'ils surviennent après lui : `report_generated` au moment où le
 * rapport est constitué, `report_sent` quand Resend accepte le message. Les événements
 * du parcours restent, eux, émis par `gtag` côté client.
 *
 * Même contrat que `capi.ts` : régi par les réglages `app_setting`, silencieux si les
 * identifiants manquent, jamais bloquant. Chaque envoi passe par `tracking_event_outbox`,
 * qui garantit qu'un même `event_id` ne part qu'une fois.
 */

const ENDPOINT = 'https://www.google-analytics.com/mp/collect'

/**
 * Identifiant client GA4. Le cookie `_ga` est présent dès que l'internaute a accepté la
 * catégorie analytique : on reprend alors son identifiant pour que l'événement serveur se
 * rattache à la même session que les événements du navigateur. Sinon, un identifiant
 * pseudonyme dérivé d'une graine stable (l'identifiant du rapport, par exemple) tient le
 * rôle : il ne permet pas de remonter à une personne et reste constant d'un envoi à l'autre.
 */
export function clientIdGa4(event: H3Event | null, graine: string): string {
  const brut = event ? getCookie(event, '_ga') : undefined
  const m = brut?.match(/^GA\d\.\d\.(\d+\.\d+)$/)
  if (m?.[1]) return m[1]
  const h = createHash('sha256').update(graine).digest('hex')
  return `${parseInt(h.slice(0, 8), 16)}.${parseInt(h.slice(8, 16), 16)}`
}

/**
 * `event` peut être nul : l'envoi d'un rapport a lieu hors du contexte d'une requête du
 * visiteur (relance groupée, renvoi depuis l'admin). L'identifiant client tombe alors sur
 * la graine, en pratique l'identifiant du rapport, commun aux deux événements.
 */
export async function envoyerGa4(
  event: H3Event | null,
  nom: string,
  eventId: string,
  params: Record<string, unknown> = {},
  graineClient?: string,
) {
  const ligne = await journaliserEvenement(nom, eventId, { params }, ['ga4_mp'])
  if (!ligne) return

  try {
    const r = await reglages()
    const measurementId = r.ga4_measurement_id
    const secret = r.ga4_api_secret
    if (r.tracking_enabled !== 'true') return marquerEchec(ligne, 'tracking désactivé')
    if (!measurementId || !secret) return marquerEchec(ligne, 'ga4_measurement_id ou ga4_api_secret absent')

    const url = `${ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(secret)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: clientIdGa4(event, graineClient ?? eventId),
        // Aucun signal publicitaire : ces événements servent la mesure, pas le ciblage.
        non_personalized_ads: true,
        events: [
          {
            name: nom,
            // Sans `engagement_time_msec`, GA4 accepte l'événement mais ne compte pas
            // de session : la valeur minimale suffit pour un événement serveur.
            params: { ...params, engagement_time_msec: 1 },
          },
        ],
      }),
      signal: AbortSignal.timeout(4000),
    })
    // Le Measurement Protocol répond 204 sans valider le contenu : un 2xx signifie
    // « reçu », pas « exploitable ». La validation se fait en recette avec DebugView.
    if (res.ok) return marquerEnvoye(ligne)
    await marquerEchec(ligne, `${res.status} ${(await res.text()).slice(0, 200)}`)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.warn('[ga4]', nom, message)
    await marquerEchec(ligne, message)
  }
}
