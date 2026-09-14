import { archetypes, dimensions, RAYONNEMENT_DIMS } from '@radar/scoring'
import type { DirigeantResult, RayonnementResult } from '@radar/scoring'
import type { DimBar, PublicResult } from '#shared/types/result'

/** Slug ASCII stable, pour indexer une icône sans dépendre du libellé français. */
const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/**
 * Libellés servis par l'API et non dupliqués côté client : `app/` ne doit jamais
 * importer `@radar/scoring`, dont l'index de module embarquerait `options.json`
 * — et donc les constats commerciaux internes — dans le bundle navigateur.
 */
function bars<K extends string>(source: readonly { code: K; nom: string }[], valeurs: Record<K, number>): DimBar[] {
  return source.map((d) => ({ code: d.code, nom: d.nom, valeur: Math.round(valeurs[d.code]) }))
}

/** Filtre public : jamais pilotage, affinités, classement, tie-break. */
export function toPublicResult(type: 'dirigeant' | 'rayonnement', result: unknown): PublicResult {
  if (type === 'dirigeant') {
    const r = result as DirigeantResult
    const main = archetypes.find((a) => a.code === r.principal)!
    const sec = r.secondaire ? archetypes.find((a) => a.code === r.secondaire) : null
    return {
      type,
      principal: { code: main.code, inspirePar: main.inspirePar, traits: main.traits, forces: main.forces, risque: main.risque },
      secondaire: sec ? { code: sec.code, inspirePar: sec.inspirePar } : null,
      dims: bars(dimensions, r.norm),
    }
  }
  const r = result as RayonnementResult
  return {
    type,
    score: r.scoreAffiche,
    niveau: r.niveau,
    meteo: r.meteo,
    meteoCode: slug(r.meteo),
    nuance: r.nuance,
    differenciation: r.differenciation,
    dims: bars(RAYONNEMENT_DIMS, r.dims),
  }
}
