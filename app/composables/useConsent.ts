/**
 * Choix de cookies (C01/C02). Tenu dans le navigateur pour six mois, prouvé côté serveur
 * par `POST /api/public/consent`. Tant qu'aucun choix n'est enregistré, ni Google
 * Analytics ni Meta Pixel ne sont chargés ; la Conversions API n'est ni un cookie ni une
 * option (CDC C01/C02).
 */
export interface ChoixCookies {
  analytics: boolean
  ads: boolean
  at: string
  version: string
}

const CLE = 'radar:cookies'
const DUREE_MS = 182 * 24 * 60 * 60 * 1000
export const TEXT_VERSION_COOKIES = 'c01-c02-v1.2'

export function useConsent() {
  const choix = useState<ChoixCookies | null>('consent-choix', () => null)
  const charge = useState<boolean>('consent-charge', () => false)
  /** Panneau affiché : null (aucun), 'c01' bandeau, 'c02' personnalisation. */
  const panneau = useState<'c01' | 'c02' | null>('consent-panneau', () => null)

  const lire = () => {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(CLE)
      const c = raw ? (JSON.parse(raw) as ChoixCookies) : null
      choix.value = c && Date.now() - new Date(c.at).getTime() < DUREE_MS && c.version === TEXT_VERSION_COOKIES ? c : null
    } catch {
      choix.value = null
    }
    charge.value = true
    if (!choix.value && panneau.value === null) panneau.value = 'c01'
  }

  const enregistrer = async (analytics: boolean, ads: boolean, source: 'c01' | 'c02' | 'footer') => {
    const c: ChoixCookies = { analytics, ads, at: new Date().toISOString(), version: TEXT_VERSION_COOKIES }
    choix.value = c
    panneau.value = null
    try {
      localStorage.setItem(CLE, JSON.stringify(c))
    } catch {}
    $fetch('/api/public/consent', { method: 'POST', body: { analytics, ads, source } }).catch(() => null)
    if (import.meta.client) window.dispatchEvent(new CustomEvent('radar:consent', { detail: c }))
  }

  const ouvrir = () => (panneau.value = 'c02')

  return { choix, charge, panneau, lire, enregistrer, ouvrir }
}
