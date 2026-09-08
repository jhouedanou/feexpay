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

  const complete = (eventId?: string) => $fetch<{ result: unknown; event_id: string }>(`/api/public/participations/${token.value}/complete`, { method: 'POST', body: eventId ? { eventId } : {} })

  return { token, load, save, start, state, answer, complete }
}

export const useQuestions = (type: DiagType) =>
  useFetch<{ version: string; questions: PublicQuestion[] }>(`/api/public/questions/${type}`, { key: `questions-${type}` })

export interface AutreDiagnostic {
  type: DiagType
  token: string | null
  /** Parcours terminé, résultat consultable. */
  termine: boolean
  /** Résultat public, chargé seulement s'il est terminé. */
  resultat: Record<string, any> | null
  charge: boolean
}

/**
 * État de l'autre diagnostic de la session (P05, P08, P09, P10, P11) : un jeton en
 * localStorage, et si le parcours est terminé, son résultat public. Client seulement.
 */
export function useAutreDiagnostic(type: DiagType) {
  const autre: DiagType = type === 'dirigeant' ? 'rayonnement' : 'dirigeant'
  const etat = useState<AutreDiagnostic>(`autre-diag-${autre}`, () => ({
    type: autre,
    token: null,
    termine: false,
    resultat: null,
    charge: false,
  }))
  const part = useParticipation(autre)

  const charger = async () => {
    if (!import.meta.client) return
    part.load()
    etat.value.token = part.token.value
    if (!part.token.value) {
      etat.value.charge = true
      return
    }
    try {
      const s = await part.state()
      etat.value.termine = s.status === 'completed'
      if (etat.value.termine) {
        const r = await $fetch<{ result: Record<string, any> }>(
          `/api/public/results/${part.token.value}`,
        )
        etat.value.resultat = r.result
      }
    } catch {
      etat.value.termine = false
      etat.value.resultat = null
    } finally {
      etat.value.charge = true
    }
  }

  return { etat, charger }
}

/** Thèmes du rail de progression (maquette P04/P06), par question. */
export const THEMES: Record<DiagType, { nom: string; questions: string[] }[]> = {
  dirigeant: [
    { nom: 'Décision et arbitrage', questions: ['Q1', 'Q2', 'Q3'] },
    { nom: 'Organisation', questions: ['Q4'] },
    { nom: 'Maîtrise financière', questions: ['Q5', 'Q6', 'Q7', 'Q8', 'Q9'] },
    { nom: 'Relation client', questions: ['Q10', 'Q11', 'Q12'] },
    { nom: 'Vision et croissance', questions: ['Q13', 'Q14'] },
  ],
  rayonnement: [
    { nom: 'Notoriété locale', questions: ['R1'] },
    { nom: 'Différenciation', questions: ['R2', 'R4'] },
    { nom: 'Recommandation', questions: ['R3'] },
    { nom: 'Présence numérique', questions: ['R5'] },
    { nom: 'Canaux de vente', questions: ['R6'] },
    { nom: 'Empreinte territoriale', questions: ['R7'] },
  ],
}

export const METEO_ICONE: Record<string, string> = {
  Soleil: 'weather-sunny',
  Éclaircies: 'weather-partly-cloudy',
  Nuageux: 'weather-cloudy',
  Pluie: 'weather-rainy',
  Tempête: 'weather-lightning-rainy',
}

/** Nom de fichier de l'emblème d'un archétype : « Stratège » → « stratege ». */
export const slugArchetype = (code: string) =>
  code
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
