export type Dim = 'VIS' | 'STR' | 'EXE' | 'ORG' | 'INF' | 'AUD' | 'ADA' | 'TRA'
export type Lettre = 'A' | 'B' | 'C' | 'D'
export type DiagnosticType = 'dirigeant' | 'rayonnement'

/** Réponses : code question -> lettre (ex. { Q1: 'B', ... }). */
export type Answers = Record<string, Lettre>

export interface Tag {
  tag: string
  valeur: string
}
export interface Constat {
  dimension: string
  nature: string
  gravite: number
  niveau: string
  factuel: string
  difficulte: string
  hypothese: string
  relance: string
  usage: string
}
export interface Option {
  code: string
  questionCode: string
  lettre: Lettre
  texte: string
  dim2?: Dim
  dim1?: Dim
  dimension?: string
  qualification?: string | null
  points: number | null
  poids?: number
  applicable?: boolean
  tags: Tag[]
  constat: Constat | null
}
export interface Question {
  code: string
  type: DiagnosticType
  ordre: number
  texte: string
}
export interface Archetype {
  code: string
  inspirePar: string
  dims: [Dim, Dim, Dim]
  poids: [number, number, number]
  traits: string
  forces: string
  risque: string
}
export interface CombinedRule {
  id: string
  theme: string
  gravite: number
  condition: string
  groups: string[][]
  signaux: string
  hypothese: string
  relance: string
}

export interface DirigeantResult {
  raw: Record<Dim, number>
  norm: Record<Dim, number>
  affinites: Record<string, number>
  principal: string
  principalAffinite: number
  secondaire: string | null
  secondaireAffinite: number | null
  tieBreak: TieBreak | null
  /** Interne, jamais public. */
  pilotage: { score: number; niveau: string; denominateur: number }
}
export interface TieBreak {
  candidats: string[]
  etapes: { critere: string; valeurs: Record<string, number>; restants: string[] }[]
  retenu: string
}
export interface RayonnementResult {
  dims: { notoriete: number; lectureConcurrentielle: number; differenciation: number; digital: number; empreinte: number }
  score: number
  scoreAffiche: number
  niveau: string
  meteo: string
  nuance: string | null
  differenciation: string
}
export interface CrossResult {
  code: 'CC' | 'PS' | 'RT' | 'FR'
  lecture: string
  pilotage: number
  rayonnement: number
  ecart: number
  qualificatif: string
}
export interface InsightItem {
  code: string
  question: string
  option: string
  dimension: string
  nature: string
  gravite: number
  texte: string
}
export interface HypothesisItem {
  id: string
  theme: string
  gravite: number
  signaux: string
  hypothese: string
  relance: string
  codes: string[]
}
export interface Proof {
  code: string
  question: string
  option: string
  version: string
  date: string
}
export interface Insights {
  facts: InsightItem[]
  difficulties: InsightItem[]
  forces: InsightItem[]
  hypotheses: HypothesisItem[]
  proofs: Proof[]
}

export class ScoringError extends Error {
  constructor(
    public code: 'INCOMPLETE_PARTICIPATION' | 'INVALID_ANSWER',
    message: string,
  ) {
    super(message)
  }
}
