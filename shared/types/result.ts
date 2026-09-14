/**
 * Formes publiques renvoyées par l'API de résultats.
 *
 * Vit dans `shared/` pour être typé des deux côtés : `app/` ne peut pas importer
 * `server/utils/result.ts`, qui importe `@radar/scoring` — et embarquerait donc
 * `options.json`, avec les constats commerciaux internes, dans le bundle client.
 */

/** Une barre de dimension : code technique, libellé affichable, valeur entière 0–100. */
export interface DimBar {
  code: string
  nom: string
  valeur: number
}

export interface PublicArchetype {
  code: string
  inspirePar: string
  traits: string
  forces: string
  risque: string
}

/** Jamais de pilotage, d'affinités, de classement ni de tie-break. */
export interface PublicDirigeantResult {
  type: 'dirigeant'
  principal: PublicArchetype
  secondaire: Pick<PublicArchetype, 'code' | 'inspirePar'> | null
  dims: DimBar[]
}

export interface PublicRayonnementResult {
  type: 'rayonnement'
  score: number
  niveau: string
  meteo: string
  /** Slug ASCII du libellé météo, pour indexer une icône sans dépendre du français. */
  meteoCode: string
  nuance: string | null
  differenciation: string
  dims: DimBar[]
}

export type PublicResult = PublicDirigeantResult | PublicRayonnementResult
