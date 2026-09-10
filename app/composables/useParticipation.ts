export type DiagType = 'dirigeant' | 'rayonnement'
export type Lettre = 'A' | 'B' | 'C' | 'D'

export interface PublicQuestion {
  code: string
  ordre: number
  texte: string
  options: { code: string; lettre: Lettre; texte: string }[]
}

const KEY = (type: DiagType) => `radar:participation:${type}`
const FILE_KEY = (type: DiagType) => `radar:file:${type}`

interface ReponseEnAttente {
  token: string
  questionCode: string
  optionCode: string
  at: number
}

/**
 * État réseau partagé par les écrans du parcours (PLAN.md §7). `enAttente` compte les
 * réponses enregistrées localement, pas encore parvenues au serveur.
 */
export function useHorsLigne() {
  return {
    horsLigne: useState<boolean>('radar-hors-ligne', () => false),
    enAttente: useState<number>('radar-file-attente', () => 0),
  }
}

/** Une erreur portant un code HTTP vient du serveur ; sans code, c'est le réseau. */
function estPanneReseau(e: unknown): boolean {
  if (import.meta.client && !navigator.onLine) return true
  const code = (e as { statusCode?: number; status?: number })?.statusCode ?? (e as { status?: number })?.status
  return typeof code !== 'number'
}

function lireFile(type: DiagType): ReponseEnAttente[] {
  try {
    const brut = localStorage.getItem(FILE_KEY(type))
    return brut ? (JSON.parse(brut) as ReponseEnAttente[]) : []
  } catch {
    return []
  }
}

function ecrireFile(type: DiagType, file: ReponseEnAttente[]) {
  try {
    file.length ? localStorage.setItem(FILE_KEY(type), JSON.stringify(file)) : localStorage.removeItem(FILE_KEY(type))
  } catch {}
}

/** Jeton de participation par type, en localStorage (reprise 7 j). */
export function useParticipation(type: DiagType) {
  const token = useState<string | null>(`participation-token-${type}`, () => null)
  const { horsLigne, enAttente } = useHorsLigne()

  const majCompteur = () => {
    if (import.meta.client) enAttente.value = lireFile(type).length
  }

  /**
   * Rejoue les réponses en attente, dans l'ordre. L'enregistrement est idempotent côté
   * serveur (`on conflict do update`), le rejeu est donc sans risque. Une réponse refusée
   * par le serveur (jeton expiré, question inconnue) est écartée : la réessayer
   * indéfiniment bloquerait celles qui suivent.
   */
  const vider = async (): Promise<void> => {
    if (!import.meta.client) return
    let file = lireFile(type)
    while (file.length) {
      const r = file[0]!
      try {
        await $fetch(`/api/public/participations/${r.token}/answers/${r.questionCode}`, {
          method: 'PUT',
          body: { optionCode: r.optionCode },
        })
      } catch (e) {
        if (estPanneReseau(e)) {
          horsLigne.value = true
          return
        }
        console.warn('[file] réponse écartée', r.questionCode, e)
      }
      file = file.slice(1)
      ecrireFile(type, file)
      majCompteur()
    }
    horsLigne.value = false
  }

  const load = () => {
    if (!import.meta.client) return
    try {
      token.value = localStorage.getItem(KEY(type))
    } catch {
      token.value = null
    }
    majCompteur()
    // Un retour du réseau relance la file sans que l'internaute ait à faire quoi que ce soit.
    if (!ecouteurs.has(type)) {
      ecouteurs.add(type)
      window.addEventListener('online', () => {
        horsLigne.value = false
        void vider()
      })
      window.addEventListener('offline', () => {
        horsLigne.value = true
      })
    }
    if (navigator.onLine) void vider()
    else horsLigne.value = true
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

  /**
   * Enregistre une réponse. Une coupure réseau ne doit pas arrêter le parcours : la
   * réponse est mise en file locale et rejouée au retour en ligne. Une erreur du serveur,
   * elle, remonte à l'appelant — c'est une réponse refusée, pas un problème de réseau.
   */
  const answer = async (questionCode: string, optionCode: string) => {
    const t = token.value
    if (!t) throw new Error('Participation absente')
    try {
      const r = await $fetch(`/api/public/participations/${t}/answers/${questionCode}`, {
        method: 'PUT',
        body: { optionCode },
      })
      horsLigne.value = false
      return r
    } catch (e) {
      if (!estPanneReseau(e)) throw e
      const file = lireFile(type).filter((x) => !(x.token === t && x.questionCode === questionCode))
      file.push({ token: t, questionCode, optionCode, at: Date.now() })
      ecrireFile(type, file)
      majCompteur()
      horsLigne.value = true
      return { differee: true as const }
    }
  }

  /**
   * Complétion : les réponses en attente doivent être parties avant le calcul, sinon le
   * serveur refuserait un parcours incomplet. En cas d'échec, la file reste et l'erreur
   * remonte pour que l'écran de calcul invite à réessayer.
   */
  const complete = async (eventId?: string) => {
    await vider()
    if (import.meta.client && lireFile(type).length) {
      throw createError({ statusCode: 503, statusMessage: 'REPONSES_EN_ATTENTE' })
    }
    return $fetch<{ result: unknown; event_id: string }>(`/api/public/participations/${token.value}/complete`, {
      method: 'POST',
      body: eventId ? { eventId } : {},
    })
  }

  return { token, load, save, start, state, answer, complete, vider, horsLigne, enAttente }
}

/** Écouteurs `online`/`offline` posés une seule fois par type de diagnostic. */
const ecouteurs = new Set<DiagType>()

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
