/**
 * Lecture croisée pilotage x rayonnement — PLAN §5.3.
 * Seuil 60/60 appliqué aux scores exacts (jamais aux valeurs affichées).
 * Libellés d'écart : onglet « Lecture croisée » de la matrice (le Simulateur en utilise d'autres).
 */
import { getVersion } from './data'
import type { CrossCode, CrossResult, DirigeantResult, RayonnementResult } from './types'

/** Qualificatif d'écart tel que libellé dans la matrice. */
const QUALIFICATIFS = {
  coherence: 'Cohérence relative',
  sousExploitees: 'Fondations sous-exploitées',
  expose: 'Rayonnement exposé',
} as const

/**
 * Croise le pilotage interne (diagnostic Dirigeant) et le rayonnement.
 * Les deux participations doivent porter la même version de scoring.
 */
export function crossReading(dirigeant: DirigeantResult, rayonnement: RayonnementResult): CrossResult {
  if (dirigeant.version !== rayonnement.version) {
    throw new Error(
      `VERSION_MISMATCH: dirigeant ${dirigeant.version} vs rayonnement ${rayonnement.version}`,
    )
  }
  const { seuil, ecartMax, readings, ecartQualificatifs } = getVersion(dirigeant.version).constants.cross

  const p = dirigeant.pilotage.score
  const r = rayonnement.score
  const code: CrossCode = p >= seuil ? (r >= seuil ? 'CC' : 'PS') : r >= seuil ? 'RT' : 'FR'
  const reading = readings.find((x) => x.code === code)
  if (!reading) throw new Error(`CROSS_READING_MISSING: ${code}`)

  const ecart = r - p
  const label =
    Math.abs(ecart) <= ecartMax
      ? QUALIFICATIFS.coherence
      : ecart > ecartMax
        ? QUALIFICATIFS.expose
        : QUALIFICATIFS.sousExploitees
  const qualificatif = ecartQualificatifs.find((q) => q.qualificatif === label)
  if (!qualificatif) throw new Error(`ECART_QUALIFICATIF_MISSING: ${label}`)

  return {
    code,
    pilotage: p,
    rayonnement: r,
    ecart,
    qualificatif: qualificatif.qualificatif,
    ecartLecture: qualificatif.lecture,
    ecartAction: qualificatif.action,
    lecture: reading.lecture,
    interpretation: reading.interpretation,
    prioriteFeexpay: reading.prioriteFeexpay,
    prioriteMarketing: reading.prioriteMarketing,
    formulation: reading.formulation,
  }
}
