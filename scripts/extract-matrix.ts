/**
 * Extrait la matrice normative V2.1 (xlsx) vers packages/scoring/src/versions/v2.1/*.json.
 * Textes repris sans modification. Le tag « Produit FeexPay » (Q14) n'est pas exporté (CDC : aucune reco produit).
 */
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import XLSX from 'xlsx'

const SRC = process.argv[2] ?? 'MarketingBS/Annexe_01_Matrice_scoring_Radar_by_FeexPay_V2.1_Normative.xlsx'
// Version lue dans le nom du fichier (…_V2.2_…) ou passée en 3e argument.
const VERSION = process.argv[3] ?? /_V(\d+\.\d+)_/.exec(SRC)?.[1] ?? '2.1'
const OUT = `packages/scoring/src/versions/v${VERSION}`

const wb = XLSX.readFile(SRC)
const rows = (name: string): unknown[][] =>
  XLSX.utils.sheet_to_json(wb.Sheets[name]!, { header: 1, defval: null }) as unknown[][]
const s = (v: unknown) => (v == null ? '' : String(v).trim())
const n = (v: unknown) => (v == null || v === '' ? null : Number(v))
const isCode = (v: unknown) => /^[QR]\d+[A-D]$/.test(s(v))

// --- Dirigeant
const dir = rows('Dirigeant - Matrice').filter((r) => isCode(r[0]))
// --- Rayonnement
const ray = rows('Rayonnement - Matrice').filter((r) => isCode(r[0]))
// --- Constats
const constats = new Map(
  rows('Bibliothèque constats')
    .filter((r) => isCode(r[0]))
    .map((r) => [
      s(r[0]),
      {
        dimension: s(r[5]),
        nature: s(r[6]),
        gravite: n(r[7]) ?? 0,
        niveau: s(r[8]),
        factuel: s(r[9]),
        difficulte: s(r[10]),
        hypothese: s(r[11]),
        relance: s(r[12]),
        usage: s(r[13]),
      },
    ]),
)

const questions: unknown[] = []
const options: unknown[] = []
const seenQ = new Set<string>()

for (const r of dir) {
  const code = s(r[0])
  const qCode = code.slice(0, -1)
  if (!seenQ.has(qCode)) {
    seenQ.add(qCode)
    questions.push({ code: qCode, type: 'dirigeant', ordre: Number(r[1]), texte: s(r[2]) })
  }
  const tags: { tag: string; valeur: string }[] = []
  if (s(r[12])) tags.push({ tag: s(r[12]), valeur: s(r[13]) })
  if (s(r[14]) && s(r[14]) !== 'Produit FeexPay') tags.push({ tag: s(r[14]), valeur: s(r[15]) })
  options.push({
    code,
    questionCode: qCode,
    lettre: code.slice(-1),
    texte: s(r[3]),
    dim2: s(r[4]),
    dim1: s(r[6]),
    qualification: s(r[8]) || null,
    points: n(r[9]),
    poids: n(r[10]) ?? 0,
    applicable: Number(r[11]) === 1,
    tags,
    constat: constats.get(code) ?? null,
  })
}
for (const r of ray) {
  const code = s(r[0])
  const qCode = code.slice(0, -1)
  if (!seenQ.has(qCode)) {
    seenQ.add(qCode)
    questions.push({ code: qCode, type: 'rayonnement', ordre: Number(r[1]), texte: s(r[2]) })
  }
  options.push({
    code,
    questionCode: qCode,
    lettre: code.slice(-1),
    texte: s(r[3]),
    dimension: s(r[4]),
    points: n(r[5]),
    tags: [{ tag: s(r[7]), valeur: s(r[8]) }],
    constat: constats.get(code) ?? null,
  })
}

// --- Archétypes
const arch = rows('Archétypes & règles')
const archetypes = arch
  .filter((r, i) => i >= 4 && i <= 11 && s(r[0]))
  .map((r) => ({
    code: s(r[0]),
    inspirePar: s(r[1]),
    dims: [s(r[2]), s(r[3]), s(r[4])],
    poids: [Number(r[5]), Number(r[6]), Number(r[7])],
    traits: s(r[8]),
    forces: s(r[9]),
    risque: s(r[10]),
  }))
const dimensions = arch
  .filter((r, i) => i >= 15 && i <= 22 && s(r[0]))
  .map((r) => ({ code: s(r[0]), nom: s(r[1]), definition: s(r[2]) }))
const pilotageLevels = arch
  .filter((r, i) => i >= 35 && i <= 38 && s(r[0]))
  .map((r) => ({ min: Number(s(r[0]).split('–')[0]), niveau: s(r[1]), lecture: s(r[2]) }))

// --- Lecture croisée + rayonnement
const lc = rows('Lecture croisée')
const crossReadings = lc
  .filter((r, i) => i >= 6 && i <= 9)
  .map((r) => ({
    code: s(r[7]),
    pilotage: s(r[0]).startsWith('≥') ? 'high' : 'low',
    rayonnement: s(r[1]).startsWith('≥') ? 'high' : 'low',
    lecture: s(r[2]),
    interpretation: s(r[3]),
    prioriteFeexpay: s(r[4]),
    prioriteMarketing: s(r[5]),
    formulation: s(r[6]),
  }))
const ecartQualificatifs = lc
  .filter((r, i) => i >= 13 && i <= 15)
  .map((r) => ({ plage: s(r[0]), qualificatif: s(r[1]), lecture: s(r[2]), action: s(r[3]) }))
const rayonnementLevels = lc
  .filter((r, i) => i >= 27 && i <= 31)
  .map((r) => ({ min: Number(s(r[0]).split('–')[0]), niveau: s(r[1]), meteo: s(r[2]), lecture: s(r[3]) }))

// --- Règles combinées
const combinedRules = rows('Règles combinées')
  .filter((r) => /^RC\d+$/.test(s(r[0])))
  .map((r) => ({
    id: s(r[0]),
    theme: s(r[1]),
    gravite: Number(r[2]),
    condition: s(r[3]),
    // "Q10C ou Q10D + Q11A, Q11B ou Q11C" -> [[Q10C,Q10D],[Q11A,Q11B,Q11C]] (OR intra-groupe, AND inter-groupes)
    groups: s(r[3])
      .split('+')
      .map((g) => g.match(/[QR]\d+[A-D]/g) ?? []),
    signaux: s(r[4]),
    hypothese: s(r[5]),
    relance: s(r[6]),
  }))

const constants = {
  version: VERSION,
  dirigeant: {
    max: { VIS: 12, STR: 15, EXE: 17, ORG: 18, INF: 17, AUD: 15, ADA: 16, TRA: 17 },
    ordreTechnique: archetypes.map((a) => a.code),
    secondaire: { minAffinite: 55, ratioMin: 0.9, ecartMax: 8 },
    pilotageLevels,
  },
  rayonnement: {
    poids: { notoriete: 0.2, lectureConcurrentielle: 0.15, differenciation: 0.25, digital: 0.2, empreinte: 0.2 },
    digital: { r5: 0.6, r6: 0.4 },
    levels: rayonnementLevels,
    nuance: { marge: 5, dimsMin: 2, minDim: 20, libelle: 'avec potentiel d’éclaircie' },
  },
  cross: { seuil: 60, ecartMax: 15, readings: crossReadings, ecartQualificatifs },
  insights: { maxDifficultes: 6, maxForces: 4, maxHypotheses: 6 },
}

mkdirSync(OUT, { recursive: true })
const files: Record<string, unknown> = {
  'questions.json': questions,
  'options.json': options,
  'archetypes.json': archetypes,
  'dimensions.json': dimensions,
  'combined-rules.json': combinedRules,
  'constants.json': constants,
}
const hash = createHash('sha256')
for (const [name, data] of Object.entries(files)) {
  const txt = JSON.stringify(data, null, 2) + '\n'
  writeFileSync(join(OUT, name), txt)
  hash.update(name).update(txt)
}
writeFileSync(join(OUT, 'checksum.json'), JSON.stringify({ version: VERSION, sha256: hash.digest('hex'), source: SRC }, null, 2) + '\n')
console.log(`OK: ${questions.length} questions, ${options.length} options, ${archetypes.length} archétypes, ${combinedRules.length} règles`)
