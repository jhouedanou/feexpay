/** Utilitaires numériques. Les seuils s'appliquent sur les floats non arrondis ; l'arrondi est un choix d'affichage / de comparaison explicite. */

/**
 * Arrondi à `d` décimales, demi-entier à l'écart de zéro.
 * Passe par la notation exponentielle pour éviter les artefacts binaires (`1.005` -> `1.01`, pas `1`).
 */
export function round(value: number, d = 2): number {
  if (!Number.isFinite(value)) throw new Error(`ROUND_INVALID: ${value}`)
  const sign = value < 0 ? -1 : 1
  const shifted = Number(`${Math.abs(value)}e${d}`)
  return sign * Number(`${Math.round(shifted)}e-${d}`)
}

/** Arrondi à 2 décimales — précision de comparaison des affinités (PLAN §5.1). */
export const round2 = (v: number): number => round(v, 2)

/** Premier palier dont `min` est atteint (bornes inclusives). */
export function level<T extends { min: number }>(levels: readonly T[], score: number): T {
  const found = [...levels].sort((a, b) => b.min - a.min).find((l) => score >= l.min)
  if (!found) throw new Error('LEVELS_MISCONFIGURED: aucun palier applicable')
  return found
}
