/**
 * Moteur de scoring Radar by FeexPay — V2.1.
 * Pur, déterministe, versionné, sans dépendance ni I/O : la même paire (réponses, version)
 * produit toujours le même snapshot. Autorité serveur (CDC F.1).
 */
export { answersFromLetters, validate, type ValidatedAnswers } from './answers'
export { crossReading } from './cross'
export { CURRENT_VERSION, getVersion, listVersions, V2_1, type ScoringVersion } from './data'
export { scoreDirigeant } from './dirigeant'
export { ScoringError, type ScoringErrorCode } from './errors'
export { buildInsights, type InsightInput } from './insights'
export { toPublicDirigeant, toPublicRayonnement } from './public'
export { scoreRayonnement } from './rayonnement'
export { level, round, round2 } from './utils'
export type * from './types'
