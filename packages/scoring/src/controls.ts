import { answersFromLetters } from './answers'
import { crossReading } from './cross'
import { scoreDirigeant } from './dirigeant'
import { scoreRayonnement } from './rayonnement'
import { round2 } from './utils'

/**
 * Cas de contrôle de la matrice normative (§5.5) : partagés par la suite de tests du moteur et
 * par la publication d'une version en admin (T01). Toute divergence est une régression du
 * moteur ou un écart de la matrice, jamais une valeur à ajuster.
 */
export const CAS_CONTROLE = [
  { nom: 'Principal', dir: 'BCBADBADDBCADA', ray: 'CCCCCCC', archetype: 'Stratège', affinite: 61.67, pilotage: 62.96, rayonnement: 66.67, niveau: 'Challenger fort', meteo: 'Éclaircies', cross: 'CC' },
  { nom: 'Contrôle A', dir: 'AAAAAAAAAAAAAA', ray: 'AAAAAAA', archetype: 'Réformateur', affinite: 66.78, pilotage: 100, rayonnement: 0, niveau: 'Zone de disparition', meteo: 'Tempête', cross: 'PS' },
  { nom: 'Contrôle B', dir: 'BBBBBBBBBBBBBB', ray: 'BBBBBBB', archetype: 'Gestionnaire', affinite: 51.24, pilotage: 66.67, rayonnement: 33.33, niveau: 'Marque fragile', meteo: 'Pluie', cross: 'PS' },
  { nom: 'Contrôle C', dir: 'CCCCCCCCCCCCCC', ray: 'CCCCCCC', archetype: 'Fédérateur', affinite: 63.86, pilotage: 33.33, rayonnement: 66.67, niveau: 'Challenger fort', meteo: 'Éclaircies', cross: 'RT' },
  { nom: 'Contrôle D', dir: 'DDDDDDDDDDDDDD', ray: 'DDDDDDD', archetype: 'Conquérant', affinite: 63.21, pilotage: 0, rayonnement: 100, niveau: 'Dominant', meteo: 'Soleil', cross: 'RT' },
] as const

export const CAS_ARCHETYPES = [
  { code: 'Visionnaire', dir: 'ADCBCCAAADADAD', affinite: 63.48, marge: 23.5 },
  { code: 'Bâtisseur', dir: 'CADBCCBCBADCBB', affinite: 58.78, marge: 15.73 },
  { code: 'Conquérant', dir: 'DDADCCDBDCDABC', affinite: 70.15, marge: 25.36 },
  { code: 'Fédérateur', dir: 'CCCCCDADBBCBCA', affinite: 71.41, marge: 27.1 },
  { code: 'Résilient', dir: 'BADCDDCCCBCCBD', affinite: 65.44, marge: 21.15 },
  { code: 'Gestionnaire', dir: 'DABBABBBADADDC', affinite: 61.38, marge: 11.45 },
  { code: 'Réformateur', dir: 'DBDADACADABADA', affinite: 67.51, marge: 26.68 },
  { code: 'Stratège', dir: 'BCBADBADDBCADA', affinite: 61.67, marge: 26.7 },
] as const

/** Cas de départage V2.2 : Réformateur et Visionnaire à 37,25, le score central tranche pour le Réformateur (41,18 > 33,33). */
export const CAS_DEPARTAGE = { dir: 'CCDBDACABDDACB', gagnant: 'Réformateur', perdant: 'Visionnaire', regle: 'normCentrale' } as const

export interface ResultatControle {
  nom: string
  ok: boolean
  attendu: string
  obtenu: string
}

/** Exécute tous les cas de contrôle sur une version du moteur. Aucune exception : chaque écart est un résultat. */
export function executerControles(version: string): ResultatControle[] {
  const out: ResultatControle[] = []
  const push = (nom: string, attendu: unknown, obtenu: unknown) =>
    out.push({ nom, ok: JSON.stringify(attendu) === JSON.stringify(obtenu), attendu: String(attendu), obtenu: String(obtenu) })
  for (const c of CAS_CONTROLE) {
    try {
      const d = scoreDirigeant(answersFromLetters('dirigeant', c.dir, version), version)
      const r = scoreRayonnement(answersFromLetters('rayonnement', c.ray, version), version)
      push(`${c.nom} · archétype`, c.archetype, d.principal.code)
      push(`${c.nom} · affinité`, c.affinite, d.principal.affinite)
      push(`${c.nom} · pilotage`, c.pilotage, round2(d.pilotage.score))
      push(`${c.nom} · rayonnement`, c.rayonnement, round2(r.score))
      push(`${c.nom} · niveau`, c.niveau, r.niveau)
      push(`${c.nom} · lecture croisée`, c.cross, crossReading(d, r).code)
    } catch (e) {
      push(`${c.nom}`, 'calcul', e instanceof Error ? e.message : String(e))
    }
  }
  for (const c of CAS_ARCHETYPES) {
    try {
      const d = scoreDirigeant(answersFromLetters('dirigeant', c.dir, version), version)
      push(`Atteignable · ${c.code}`, c.code, d.principal.code)
      push(`Marge · ${c.code}`, c.marge, round2(d.affinities[0]!.exact - d.affinities[1]!.exact))
    } catch (e) {
      push(`Atteignable · ${c.code}`, c.code, e instanceof Error ? e.message : String(e))
    }
  }
  if (Number(version) >= 2.2) {
    try {
      const d = scoreDirigeant(answersFromLetters('dirigeant', CAS_DEPARTAGE.dir, version), version)
      push('Départage V2.2 · gagnant', CAS_DEPARTAGE.gagnant, d.principal.code)
      push('Départage V2.2 · règle', CAS_DEPARTAGE.regle, d.tieBreak?.etapes.at(-1)?.regle ?? 'aucun départage')
    } catch (e) {
      push('Départage V2.2', CAS_DEPARTAGE.gagnant, e instanceof Error ? e.message : String(e))
    }
  }
  return out
}
