/**
 * Tracking (annexe 04, plan V1.2) sous consentement. GA4 n'est chargé qu'avec la catégorie
 * analytique, Meta Pixel qu'avec la catégorie publicitaire ; les identifiants viennent des
 * réglages serveur (modifiables en admin). `page_view` explicite à chaque route,
 * `send_page_view` désactivé. Aucune balise noscript. `track()` est disponible partout.
 */
import type { ChoixCookies } from '~/composables/useConsent'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
  }
}

const EVENEMENTS_META: Record<string, string> = {
  page_view: 'PageView',
  form_start: 'form_start',
  generate_lead: 'Lead',
  quiz_start: 'quiz_started',
  quiz_complete: 'quiz_completed',
  report_view: 'report_view',
  share: 'share_result',
}
const STANDARD_META = new Set(['PageView', 'Lead'])

export default defineNuxtPlugin((nuxtApp) => {
  let reglages: { trackingEnabled: boolean; ga4MeasurementId: string; metaPixelId: string } | null = null
  let ga4Charge = false
  let pixelCharge = false
  const attente: { nom: string; params: Record<string, unknown> }[] = []

  const choixActuel = (): ChoixCookies | null => {
    try {
      const raw = localStorage.getItem('radar:cookies')
      return raw ? (JSON.parse(raw) as ChoixCookies) : null
    } catch {
      return null
    }
  }

  const chargerGa4 = (id: string) => {
    if (ga4Charge || !id) return
    ga4Charge = true
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
    document.head.appendChild(s)
    window.dataLayer = window.dataLayer || []
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', id, { send_page_view: false })
  }

  const chargerPixel = (id: string) => {
    if (pixelCharge || !id || window.fbq) return
    pixelCharge = true
    const n: any = (window.fbq = function () {
      // eslint-disable-next-line prefer-rest-params
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    })
    window._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(s)
    window.fbq('init', id)
  }

  const appliquer = async () => {
    const choix = choixActuel()
    if (!choix) return
    if (!reglages) reglages = await $fetch('/api/public/settings').catch(() => null)
    if (!reglages?.trackingEnabled) return
    if (choix.analytics) chargerGa4(reglages.ga4MeasurementId)
    if (choix.ads) chargerPixel(reglages.metaPixelId)
    for (const e of attente.splice(0)) envoyer(e.nom, e.params)
  }

  const envoyer = (nom: string, params: Record<string, unknown>) => {
    const choix = choixActuel()
    if (!choix) {
      attente.push({ nom, params })
      return
    }
    if (choix.analytics && window.gtag) window.gtag('event', nom, params)
    if (choix.ads && window.fbq) {
      const meta = EVENEMENTS_META[nom] ?? nom
      window.fbq(STANDARD_META.has(meta) ? 'track' : 'trackCustom', meta, params, params.event_id ? { eventID: params.event_id } : undefined)
    }
  }

  /** Événement nommé du plan de tracking ; `event_id` partagé avec la CAPI pour Lead et quiz_complete. */
  const track = (nom: string, params: Record<string, unknown> = {}) => envoyer(nom, params)

  window.addEventListener('radar:consent', () => appliquer())
  appliquer()

  nuxtApp.hook('page:finish', () => {
    track('page_view', { page_location: location.href, page_path: location.pathname, page_title: document.title })
  })

  return { provide: { track } }
})
