/**
 * Chargement et indexation des données de version.
 * Les JSON sont générés par `scripts/extract-matrix.ts` depuis la matrice normative
 * et commités : ils sont la donnée de seed de `scoring_version`.
 */
import archetypesV21 from './versions/v2.1/archetypes.json'
import checksumV21 from './versions/v2.1/checksum.json'
import combinedRulesV21 from './versions/v2.1/combined-rules.json'
import constantsV21 from './versions/v2.1/constants.json'
import dimensionsV21 from './versions/v2.1/dimensions.json'
import optionsV21 from './versions/v2.1/options.json'
import questionsV21 from './versions/v2.1/questions.json'
import type {
  ArchetypeData,
  CombinedRuleData,
  Constants,
  DimensionData,
  DiagnosticType,
  OptionCode,
  OptionData,
  QuestionCode,
  QuestionData,
} from './types'

export interface ScoringVersion {
  version: string
  checksum: string
  questions: QuestionData[]
  options: OptionData[]
  archetypes: ArchetypeData[]
  dimensions: DimensionData[]
  combinedRules: CombinedRuleData[]
  constants: Constants
  /** Index code option -> option. */
  optionByCode: ReadonlyMap<OptionCode, OptionData>
  /** Index code question -> question. */
  questionByCode: ReadonlyMap<QuestionCode, QuestionData>
  /** Codes questions par diagnostic, dans l'ordre de passation. */
  questionCodes: Record<DiagnosticType, QuestionCode[]>
}

function build(raw: {
  version: string
  checksum: string
  questions: QuestionData[]
  options: OptionData[]
  archetypes: ArchetypeData[]
  dimensions: DimensionData[]
  combinedRules: CombinedRuleData[]
  constants: Constants
}): ScoringVersion {
  const optionByCode = new Map(raw.options.map((o) => [o.code, o]))
  const questionByCode = new Map(raw.questions.map((q) => [q.code, q]))
  const codes = (type: DiagnosticType) =>
    raw.questions
      .filter((q) => q.type === type)
      .sort((a, b) => a.ordre - b.ordre)
      .map((q) => q.code)
  return {
    ...raw,
    optionByCode,
    questionByCode,
    questionCodes: { dirigeant: codes('dirigeant'), rayonnement: codes('rayonnement') },
  }
}

import archetypesV22 from './versions/v2.2/archetypes.json'
import checksumV22 from './versions/v2.2/checksum.json'
import combinedRulesV22 from './versions/v2.2/combined-rules.json'
import constantsV22 from './versions/v2.2/constants.json'
import dimensionsV22 from './versions/v2.2/dimensions.json'
import optionsV22 from './versions/v2.2/options.json'
import questionsV22 from './versions/v2.2/questions.json'

export const V2_1: ScoringVersion = build({
  version: (constantsV21 as Constants).version,
  checksum: (checksumV21 as { sha256: string }).sha256,
  questions: questionsV21 as QuestionData[],
  options: optionsV21 as OptionData[],
  archetypes: archetypesV21 as ArchetypeData[],
  dimensions: dimensionsV21 as DimensionData[],
  combinedRules: combinedRulesV21 as CombinedRuleData[],
  constants: constantsV21 as Constants,
})

/**
 * V2.2 (7 septembre 2026) : mêmes questions, options, constats et règles que la V2.1 ;
 * seule la règle de départage est précisée (score central arrondi à deux décimales) et un
 * cas de contrôle ajouté. Les snapshots V2.1 restent relus avec la V2.1.
 */
export const V2_2: ScoringVersion = build({
  version: (constantsV22 as Constants).version,
  checksum: (checksumV22 as { sha256: string }).sha256,
  questions: questionsV22 as QuestionData[],
  options: optionsV22 as OptionData[],
  archetypes: archetypesV22 as ArchetypeData[],
  dimensions: dimensionsV22 as DimensionData[],
  combinedRules: combinedRulesV22 as CombinedRuleData[],
  constants: constantsV22 as Constants,
})

const REGISTRY = new Map<string, ScoringVersion>([
  [V2_1.version, V2_1],
  [V2_2.version, V2_2],
])

/** Version par défaut du moteur (dernière publiée). */
export const CURRENT_VERSION = V2_2.version

export function getVersion(version: string = CURRENT_VERSION): ScoringVersion {
  const found = REGISTRY.get(version)
  if (!found) throw new Error(`VERSION_INACTIVE: version de scoring inconnue « ${version} »`)
  return found
}

export function listVersions(): string[] {
  return [...REGISTRY.keys()]
}
