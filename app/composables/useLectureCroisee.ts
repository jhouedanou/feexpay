import type { DiagType } from '~/composables/useParticipation'

/**
 * Où mène « Lecture croisée » selon l'avancement du visiteur.
 *
 * La lecture croisée n'est pas un écran de plus : elle naît de la mise en regard des deux
 * diagnostics et n'est remise qu'avec le rapport. Le lien doit donc conduire à l'étape qui
 * manque, et non vers une page générique — c'est ce qui donnait l'impression qu'il ne faisait
 * rien.
 *
 * La résolution est forcément côté navigateur : elle repose sur la session et sur les jetons
 * du `localStorage`. Le rendu serveur part de l'état neutre, l'hydratation l'affine.
 */

export type EtatCroisee = 'vierge' | 'un' | 'prete' | 'disponible'

export interface LectureCroisee {
  charge: boolean
  etat: EtatCroisee
  /** Jeton du dernier rapport émis sur cet appareil, s'il y en a un. */
  rapportToken: string | null
  /** Destination du lien, toujours utilisable. */
  lien: string
  /** Libellé de l'action, aligné sur l'état. */
  action: string
  /** Phrase d'accompagnement de la carte P01. */
  texte: string
}

const NEUTRE: LectureCroisee = {
  charge: false,
  etat: 'vierge',
  rapportToken: null,
  lien: '/diagnostic',
  action: 'Débloquée automatiquement →',
  texte:
    'Quand les deux diagnostics sont terminés, la mise en regard du pilotage et du rayonnement fait apparaître la zone à traiter en premier.',
}

/** Jeton du dernier rapport émis sur cet appareil, posé par P10. */
function dernierRapport(): string | null {
  try {
    const trouves: { token: string; at: number }[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const cle = localStorage.key(i)
      if (!cle?.startsWith('radar:rapport:')) continue
      const token = cle.slice('radar:rapport:'.length)
      let at = 0
      try {
        at = Number(JSON.parse(localStorage.getItem(cle) ?? '{}')?.at ?? 0)
      } catch {}
      trouves.push({ token, at })
    }
    if (!trouves.length) return null
    trouves.sort((a, b) => b.at - a.at)
    return trouves[0]!.token
  } catch {
    return null
  }
}

export function useLectureCroisee() {
  const etat = useState<LectureCroisee>('lecture-croisee', () => ({ ...NEUTRE }))

  /** Statut d'un diagnostic pour la session courante : terminé, en cours, ou absent. */
  const statut = async (type: DiagType): Promise<{ termine: boolean; token: string | null }> => {
    const part = useParticipation(type)
    part.load()
    const token = part.token.value
    if (!token) return { termine: false, token: null }
    try {
      const s = await part.state()
      return { termine: s.status === 'completed', token }
    } catch {
      return { termine: false, token: null }
    }
  }

  const resoudre = async () => {
    if (!import.meta.client) return
    const [dir, ray] = await Promise.all([statut('dirigeant'), statut('rayonnement')])

    if (dir.termine && ray.termine) {
      const rapport = dernierRapport()
      etat.value = rapport
        ? {
            charge: true,
            etat: 'disponible',
            rapportToken: rapport,
            lien: `/rapport/${rapport}#croisee`,
            action: 'Voir ma lecture croisée →',
            texte:
              'Vos deux diagnostics sont faits : la mise en regard du pilotage et du rayonnement figure dans votre rapport.',
          }
        : {
            charge: true,
            etat: 'prete',
            rapportToken: null,
            // Le formulaire de P10 est ce qui produit la lecture croisée.
            lien: `/recevoir-mon-analyse/${ray.token ?? dir.token}`,
            action: 'Recevoir ma lecture croisée →',
            texte:
              'Vos deux diagnostics sont faits. Il reste à recevoir votre analyse complète, qui porte la lecture croisée.',
          }
      return
    }

    if (dir.termine || ray.termine) {
      const manquant: DiagType = dir.termine ? 'rayonnement' : 'dirigeant'
      etat.value = {
        charge: true,
        etat: 'un',
        rapportToken: dernierRapport(),
        lien: `/diagnostic/${manquant}/introduction`,
        action: manquant === 'rayonnement' ? 'Faire le diagnostic Rayonnement →' : 'Faire le diagnostic Dirigeant →',
        texte:
          manquant === 'rayonnement'
            ? 'Un diagnostic sur deux est fait. Sept questions de plus sur votre rayonnement, et la lecture croisée se débloque.'
            : 'Un diagnostic sur deux est fait. Quatorze questions de plus sur votre pilotage, et la lecture croisée se débloque.',
      }
      return
    }

    etat.value = { ...NEUTRE, charge: true, rapportToken: dernierRapport() }
  }

  return { etat, resoudre }
}
