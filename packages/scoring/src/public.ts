/**
 * Projections publiques des résultats (P08/P09).
 * Ne doivent jamais sortir du serveur : le pilotage interne, le classement des 8 archétypes,
 * les affinités, le tie-break, les hypothèses et les constats de la fiche commerciale.
 */
import type {
  Dimension,
  DirigeantResult,
  PublicDirigeantResult,
  PublicRayonnementResult,
  RayonnementResult,
} from './types'
import { getVersion } from './data'
import { round } from './utils'

/** P08 : archétype, traits, forces, vigilance, barres de dimensions, secondaire éventuel. */
export function toPublicDirigeant(result: DirigeantResult): PublicDirigeantResult {
  const meta = new Map(getVersion(result.version).dimensions.map((d) => [d.code, d]))
  return {
    type: 'dirigeant',
    version: result.version,
    archetype: {
      code: result.principal.code,
      inspirePar: result.principal.inspirePar,
      traits: result.principal.traits,
      forces: result.principal.forces,
      risque: result.principal.risque,
    },
    secondaire: result.secondaire
      ? {
          code: result.secondaire.code,
          inspirePar: result.secondaire.inspirePar,
          traits: result.secondaire.traits,
          forces: result.secondaire.forces,
          risque: result.secondaire.risque,
        }
      : null,
    dimensions: (Object.keys(result.norm) as Dimension[]).map((code) => ({
      code,
      nom: meta.get(code)?.nom ?? code,
      definition: meta.get(code)?.definition ?? '',
      score: round(result.norm[code], 1),
    })),
  }
}

/** P09 : score entier, niveau, météo, 5 dimensions, différenciation déclarée. */
export function toPublicRayonnement(result: RayonnementResult): PublicRayonnementResult {
  return {
    type: 'rayonnement',
    version: result.version,
    score: result.scoreAffiche,
    niveau: result.niveau,
    niveauAffiche: result.niveauAffiche,
    meteo: result.meteo,
    lecture: result.lecture,
    nuance: result.nuance,
    dimensions: result.dimensions.map((d) => ({ cle: d.cle, nom: d.nom, score: round(d.score, 1) })),
    differenciation: {
      tag: result.differenciationDeclaree.tag,
      valeur: result.differenciationDeclaree.valeur,
    },
  }
}
