import { archetypes } from '@radar/scoring'

/** Filtre public : jamais pilotage, affinités, classement, tie-break. */
export function toPublicResult(type: 'dirigeant' | 'rayonnement', result: unknown) {
  const r = result as Record<string, unknown>
  if (type === 'dirigeant') {
    const main = archetypes.find((a) => a.code === r.principal)!
    const sec = r.secondaire ? archetypes.find((a) => a.code === r.secondaire) : null
    return {
      type,
      principal: { code: main.code, inspirePar: main.inspirePar, traits: main.traits, forces: main.forces, risque: main.risque },
      secondaire: sec ? { code: sec.code, inspirePar: sec.inspirePar } : null,
      norm: r.norm,
    }
  }
  return {
    type,
    score: r.scoreAffiche,
    niveau: r.niveau,
    meteo: r.meteo,
    nuance: r.nuance,
    differenciation: r.differenciation,
    dims: Object.fromEntries(Object.entries(r.dims as Record<string, number>).map(([k, v]) => [k, Math.round(v)])),
  }
}
