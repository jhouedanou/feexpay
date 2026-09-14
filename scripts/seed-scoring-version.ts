/**
 * Seed de la version de scoring publiée (PLAN.md §9, Lot 2 étape 8).
 *
 * Source de vérité : les JSON de `packages/scoring/src/versions/<version>/`, eux-mêmes
 * produits par `scripts/extract-matrix.ts` depuis la matrice normative V2.1. Ce script ne
 * fait que recopier ces données en base pour que l'admin (T01) et les jointures métier
 * disposent des libellés ; le calcul, lui, reste servi par le moteur pur.
 *
 * Idempotent : si la version existe déjà, il ne réécrit rien (le trigger
 * `guard_scoring_version` interdit de toute façon toute modification d'une version publiée).
 *
 *   nvm use 22 && pnpm seed:scoring [version]   (défaut : 2.2)
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const VERSION = process.argv[2] ?? '2.2'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, '..', 'packages', 'scoring', 'src', 'versions', `v${VERSION}`)

const readJson = <T>(name: string): T =>
  JSON.parse(readFileSync(join(dataDir, name), 'utf8')) as T

type Question = { code: string; type: 'dirigeant' | 'rayonnement'; ordre: number; texte: string }
type Option = { code: string; questionCode: string; lettre: string; texte: string } & Record<
  string,
  unknown
>

/** Charge .env sans dépendance : le repo n'embarque pas dotenv. */
function loadEnv(): Record<string, string> {
  const raw = readFileSync(join(here, '..', '.env'), 'utf8')
  const out: Record<string, string> = {}
  for (const line of raw.split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (!m) continue
    const [, key, rest] = m
    let value = rest.trim()
    if (value.startsWith('"')) value = value.slice(1, value.indexOf('"', 1))
    else if (value.startsWith("'")) value = value.slice(1, value.indexOf("'", 1))
    else value = value.split('#')[0]!.trim()
    out[key!] = value
  }
  return out
}

async function main() {
  const env = { ...loadEnv(), ...process.env }
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL manquant (.env)')

  const checksum = readJson<{ sha256: string }>('checksum.json').sha256
  const questions = readJson<Question[]>('questions.json')
  const options = readJson<Option[]>('options.json')

  const client = new pg.Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  try {
    await client.query('begin')

    const existing = await client.query<{ id: string; status: string; checksum: string }>(
      'select id, status, checksum from scoring_version where version = $1',
      [VERSION]
    )

    if (existing.rowCount) {
      const row = existing.rows[0]!
      await client.query('rollback')
      if (row.checksum !== checksum) {
        console.error(
          `✗ version ${VERSION} déjà en base (${row.status}) mais avec un checksum différent :\n` +
            `  base   ${row.checksum}\n  fichiers ${checksum}\n` +
            `  Une version publiée est immuable : publier une nouvelle version plutôt que corriger celle-ci.`
        )
        process.exitCode = 1
        return
      }
      console.log(`✓ version ${VERSION} déjà seedée (${row.status}), rien à faire.`)
      return
    }

    // Une seule version publiée à la fois : la précédente passe en `archived` (autorisé par
    // le garde, qui ne verrouille que version, checksum et published_at). Les participations
    // ouvertes gardent leur version_id et restent calculées avec.
    await client.query(`update scoring_version set status = 'archived' where status = 'published'`)

    const inserted = await client.query<{ id: string }>(
      // Une seule version publiée à la fois : la précédente passe en `archived` (autorisé
      // par le garde, qui ne verrouille que version, checksum et published_at). Les
      // participations ouvertes gardent leur version_id et restent calculées avec.
      `insert into scoring_version (version, status, checksum, published_at)
       values ($1, 'published', $2, now()) returning id`,
      [VERSION, checksum]
    )
    const versionId = inserted.rows[0]!.id

    const questionId = new Map<string, string>()
    for (const q of questions) {
      const r = await client.query<{ id: string }>(
        `insert into question (version_id, code, diagnostic_type, ordre, texte)
         values ($1, $2, $3, $4, $5) returning id`,
        [versionId, q.code, q.type, q.ordre, q.texte]
      )
      questionId.set(q.code, r.rows[0]!.id)
    }

    for (const o of options) {
      const qid = questionId.get(o.questionCode)
      if (!qid) throw new Error(`option ${o.code} : question ${o.questionCode} introuvable`)
      // Tout ce qui n'est pas colonne dédiée part en `mapping` (archive du calcul).
      const { code, questionCode: _qc, lettre, texte, ...mapping } = o
      await client.query(
        `insert into "option" (question_id, code, lettre, texte, mapping)
         values ($1, $2, $3, $4, $5)`,
        [qid, code, lettre, texte, JSON.stringify(mapping)]
      )
    }

    await client.query('commit')
    console.log(
      `✓ version ${VERSION} publiée — ${questions.length} questions, ${options.length} options, checksum ${checksum.slice(0, 12)}…`
    )
  } catch (err) {
    await client.query('rollback').catch(() => {})
    throw err
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('✗ seed échoué :', err instanceof Error ? err.message : err)
  process.exit(1)
})
