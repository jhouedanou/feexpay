/**
 * Types du moteur de scoring Radar by FeexPay.
 * Moteur pur : aucune dépendance runtime, aucune I/O, aucune date implicite.
 * Interdit par le CDC : tout champ product_*, recommended_offer, mapping constat -> produit.
 */

export type Dimension = 'VIS' | 'STR' | 'EXE' | 'ORG' | 'INF' | 'AUD' | 'ADA' | 'TRA'

export type DiagnosticType = 'dirigeant' | 'rayonnement'

export type OptionLetter = 'A' | 'B' | 'C' | 'D'

/** `Q1`..`Q14` | `R1`..`R7` */
export type QuestionCode = string
/** `Q1A`..`Q14D` | `R1A`..`R7D` */
export type OptionCode = string

export type ArchetypeCode =
  | 'Stratège'
  | 'Visionnaire'
  | 'Bâtisseur'
  | 'Conquérant'
  | 'Fédérateur'
  | 'Résilient'
  | 'Gestionnaire'
  | 'Réformateur'

export type CrossCode = 'CC' | 'PS' | 'RT' | 'FR'

/** Réponses d'une participation : code question -> code option. */
export type Answers = Record<QuestionCode, OptionCode>

// --- Données de version (JSON extraits de la matrice V2.1) ------------------

export interface QuestionData {
  code: QuestionCode
  type: DiagnosticType
  ordre: number
  texte: string
}

export interface Tag {
  tag: string
  valeur: string
}

export interface ConstatData {
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

export interface OptionData {
  code: OptionCode
  questionCode: QuestionCode
  lettre: OptionLetter
  texte: string
  /** Dirigeant : dimension +2. */
  dim2?: string
  /** Dirigeant : dimension +1. */
  dim1?: string
  /** Rayonnement : dimension mesurée (R3 = tag seul). */
  dimension?: string
  qualification?: string | null
  points: number | null
  /** Dirigeant : poids pilotage (0 hors questions de pilotage). */
  poids?: number
  /** Dirigeant : compte dans le dénominateur du pilotage. */
  applicable?: boolean
  tags: Tag[]
  constat: ConstatData | null
}

export interface ArchetypeData {
  code: ArchetypeCode
  inspirePar: string
  /** [centrale, secondaire, tertiaire] */
  dims: Dimension[]
  poids: number[]
  traits: string
  forces: string
  risque: string
}

export interface DimensionData {
  code: Dimension
  nom: string
  definition: string
}

export interface LevelData {
  min: number
  niveau: string
  lecture: string
}

export interface RayonnementLevelData extends LevelData {
  meteo: string
}

export interface CrossReadingData {
  code: CrossCode
  pilotage: 'high' | 'low'
  rayonnement: 'high' | 'low'
  lecture: string
  interpretation: string
  prioriteFeexpay: string
  prioriteMarketing: string
  formulation: string
}

export interface EcartQualificatifData {
  plage: string
  qualificatif: string
  lecture: string
  action: string
}

export interface CombinedRuleData {
  id: string
  theme: string
  gravite: number
  condition: string
  /** OR intra-groupe, AND inter-groupes. */
  groups: OptionCode[][]
  signaux: string
  hypothese: string
  relance: string
}

export interface Constants {
  version: string
  dirigeant: {
    max: Record<Dimension, number>
    ordreTechnique: ArchetypeCode[]
    secondaire: { minAffinite: number; ratioMin: number; ecartMax: number }
    pilotageLevels: LevelData[]
  }
  rayonnement: {
    poids: {
      notoriete: number
      lectureConcurrentielle: number
      differenciation: number
      digital: number
      empreinte: number
    }
    digital: { r5: number; r6: number }
    levels: RayonnementLevelData[]
    nuance: { marge: number; dimsMin: number; minDim: number; libelle: string }
  }
  cross: {
    seuil: number
    ecartMax: number
    readings: CrossReadingData[]
    ecartQualificatifs: EcartQualificatifData[]
  }
  insights: { maxDifficultes: number; maxForces: number; maxHypotheses: number }
}

// --- Résultats -------------------------------------------------------------

export interface Affinity {
  code: ArchetypeCode
  /** Affinité exacte (float non arrondi), conservée pour l'audit. */
  exact: number
  /** Affinité arrondie à 2 décimales — c'est elle qui départage. */
  value: number
}

export interface TieBreakStep {
  /** Étape qui a tranché : `normCentrale` | `plus2Centrale` | `sommeBrute` | `ordreTechnique`. */
  regle: string
  candidats: { code: ArchetypeCode; valeur: number }[]
  gagnant: ArchetypeCode
}

export interface TieBreak {
  /** Archétypes à égalité sur l'affinité arrondie. */
  exAequo: ArchetypeCode[]
  affinite: number
  etapes: TieBreakStep[]
}

export interface Archetype {
  code: ArchetypeCode
  inspirePar: string
  dims: Dimension[]
  poids: number[]
  traits: string
  forces: string
  risque: string
  affinite: number
}

export interface Pilotage {
  /** Interne : jamais exposé au public (CDC P08). */
  score: number
  niveau: string
  lecture: string
  numerateur: number
  denominateur: number
  /** Codes options retenues mais non applicables (ex. Q9D). */
  exclues: OptionCode[]
}

export interface DirigeantResult {
  type: 'dirigeant'
  version: string
  raw: Record<Dimension, number>
  /** `raw / MAX * 100`, float non arrondi. */
  norm: Record<Dimension, number>
  affinities: Affinity[]
  principal: Archetype
  secondaire: Archetype | null
  tieBreak: TieBreak | null
  pilotage: Pilotage
}

export interface RayonnementDimension {
  cle: 'notoriete' | 'lectureConcurrentielle' | 'differenciation' | 'digital' | 'empreinte'
  nom: string
  /** Score 0-100 de la dimension, float non arrondi. */
  score: number
  poids: number
  sources: OptionCode[]
}

export interface RayonnementResult {
  type: 'rayonnement'
  version: string
  dimensions: RayonnementDimension[]
  /** Score exact (float), utilisé pour tous les seuils. */
  score: number
  /** Score entier affiché. */
  scoreAffiche: number
  niveau: string
  meteo: string
  lecture: string
  /** « avec potentiel d'éclaircie » applicable. */
  nuance: boolean
  /** Niveau + nuance éventuelle, prêt à afficher. */
  niveauAffiche: string
  /** R3 : tag déclaré, non scoré. */
  differenciationDeclaree: { code: OptionCode; tag: string; valeur: string; texte: string }
}

export interface CrossResult {
  code: CrossCode
  pilotage: number
  rayonnement: number
  /** rayonnement - pilotage. */
  ecart: number
  qualificatif: string
  ecartLecture: string
  ecartAction: string
  lecture: string
  interpretation: string
  prioriteFeexpay: string
  prioriteMarketing: string
  formulation: string
}

// --- Insights (fiche commerciale, admin uniquement) ------------------------

export interface Fact {
  code: OptionCode
  questionCode: QuestionCode
  question: string
  reponse: string
  dimension: string
  nature: string
  gravite: number
  niveau: string
  factuel: string
  usage: string
}

export interface Difficulty extends Fact {
  difficulte: string
  relance: string
}

export interface Force {
  code: OptionCode
  questionCode: QuestionCode
  question: string
  reponse: string
  dimension: string
  factuel: string
  usage: string
}

export interface Declared {
  cle: 'canal' | 'condition' | 'besoin' | 'differenciation'
  code: OptionCode
  questionCode: QuestionCode
  question: string
  reponse: string
  tag: string
  valeur: string
}

export interface Hypothesis {
  id: string
  theme: string
  gravite: number
  condition: string
  signaux: string
  hypothese: string
  relance: string
  /** Codes options ayant déclenché la règle (une par groupe). */
  declencheurs: OptionCode[]
}

export interface Proof {
  code: OptionCode
  questionCode: QuestionCode
  diagnostic: DiagnosticType
  question: string
  reponse: string
  version: string
  answeredAt: string | null
}

export interface InsightSnapshot {
  version: string
  facts: Fact[]
  difficulties: Difficulty[]
  forces: Force[]
  declared: Declared[]
  hypotheses: Hypothesis[]
  proofs: Proof[]
}

// --- Projections publiques (P08/P09) ---------------------------------------
// Ni pilotage, ni classement des 8 archétypes, ni affinités, ni tie-break.

export interface PublicArchetype {
  code: ArchetypeCode
  inspirePar: string
  traits: string
  forces: string
  risque: string
}

export interface PublicDirigeantResult {
  type: 'dirigeant'
  version: string
  archetype: PublicArchetype
  secondaire: PublicArchetype | null
  dimensions: { code: Dimension; nom: string; definition: string; score: number }[]
}

export interface PublicRayonnementResult {
  type: 'rayonnement'
  version: string
  /** Score entier affiché. */
  score: number
  niveau: string
  niveauAffiche: string
  meteo: string
  lecture: string
  nuance: boolean
  dimensions: { cle: RayonnementDimension['cle']; nom: string; score: number }[]
  differenciation: { tag: string; valeur: string }
}
