import { constants } from './data'
import type { CrossResult } from './types'

export function crossReading(pilotage: number, rayonnement: number): CrossResult {
  const { seuil, ecartMax, readings, ecartQualificatifs } = constants.cross
  const p = pilotage >= seuil ? 'high' : 'low'
  const r = rayonnement >= seuil ? 'high' : 'low'
  const reading = readings.find((x) => x.pilotage === p && x.rayonnement === r)!
  const ecart = rayonnement - pilotage
  const q = Math.abs(ecart) <= ecartMax ? ecartQualificatifs[0]! : ecart < 0 ? ecartQualificatifs[1]! : ecartQualificatifs[2]!
  return { code: reading.code as CrossResult['code'], lecture: reading.lecture, pilotage, rayonnement, ecart, qualificatif: q.qualificatif }
}
