export type DiagType = 'dirigeant' | 'rayonnement'
export type Lettre = 'A' | 'B' | 'C' | 'D'

export interface PublicQuestion {
  code: string
  ordre: number
  texte: string
  options: { code: string; lettre: Lettre; texte: string }[]
}

const KEY = (type: DiagType) => `radar:participation:${type}`

/** Jeton de participation par type, en localStorage (reprise 7 j). */
export function useParticipation(type: DiagType) {
  const token = useState<string | null>(`participation-token-${type}`, () => null)

  const load = () => {
    if (!import.meta.client) return
    try {
      token.value = localStorage.getItem(KEY(type))
    } catch {
      token.value = null
    }
  }
  const save = (t: string | null) => {
    token.value = t
    if (!import.meta.client) return
    try {
      t ? localStorage.setItem(KEY(type), t) : localStorage.removeItem(KEY(type))
    } catch {}
  }

  /** Session + participation. Retourne le jeton. */
  const start = async () => {
    await $fetch('/api/public/sessions', {
      method: 'POST',
      body: import.meta.client
        ? {
            landing_url: location.href.slice(0, 2048),
            referrer: document.referrer || undefined,
            ...Object.fromEntries(
              ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']
                .map((k) => [k, new URLSearchParams(location.search).get(k) ?? undefined])
                .filter(([, v]) => v),
            ),
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          }
        : {},
    })
    const r = await $fetch<{ token: string; resumed: boolean }>('/api/public/participations', { method: 'POST', body: { type } })
    save(r.token)
    return r
  }

  const state = () =>
    $fetch<{ type: DiagType; status: string; total: number; answers: Record<string, Lettre>; current_index: number }>(
      `/api/public/participations/${token.value}`,
    )

  const answer = (questionCode: string, optionCode: string) =>
    $fetch(`/api/public/participations/${token.value}/answers/${questionCode}`, { method: 'PUT', body: { optionCode } })

  const complete = () => $fetch<{ result: unknown; event_id: string }>(`/api/public/participations/${token.value}/complete`, { method: 'POST' })

  return { token, load, save, start, state, answer, complete }
}

export const useQuestions = (type: DiagType) =>
  useFetch<{ version: string; questions: PublicQuestion[] }>(`/api/public/questions/${type}`, { key: `questions-${type}` })
