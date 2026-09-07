/**
 * Seed scoring_version 2.1 (published) + questions + options depuis packages/scoring JSON.
 * Idempotent : ne fait rien si la version existe (échoue si checksum différent).
 * CLI : `DATABASE_URL=... pnpm db:seed`
 */
import { eq } from 'drizzle-orm'
import type { PgDatabase } from 'drizzle-orm/pg-core'
import { CHECKSUM, VERSION, options, questions } from '../../packages/scoring/src'
import * as schema from './schema'

export async function seed(db: PgDatabase<any, typeof schema>) {
  const [existing] = await db.select().from(schema.scoringVersion).where(eq(schema.scoringVersion.version, VERSION))
  if (existing) {
    if (existing.checksum !== CHECKSUM) throw new Error(`Version ${VERSION} présente avec un checksum différent`)
    return { created: false }
  }
  await db.transaction(async (tx) => {
    const [v] = await tx
      .insert(schema.scoringVersion)
      .values({ version: VERSION, status: 'published', checksum: CHECKSUM, publishedAt: new Date() })
      .returning()
    const qRows = await tx
      .insert(schema.question)
      .values(questions.map((q) => ({ versionId: v!.id, code: q.code, diagnosticType: q.type, ordre: q.ordre, texte: q.texte })))
      .returning({ id: schema.question.id, code: schema.question.code })
    const qId = new Map(qRows.map((q) => [q.code, q.id]))
    await tx.insert(schema.option).values(
      options.map((o) => {
        const { code, questionCode, lettre, texte, ...mapping } = o
        return { questionId: qId.get(questionCode)!, code, lettre, texte, mapping }
      }),
    )
  })
  return { created: true }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  ;(async () => {
    const { drizzle } = await import('drizzle-orm/postgres-js')
    const { default: postgres } = await import('postgres')
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL manquant')
    const client = postgres(url, { prepare: false, max: 1 })
    const r = await seed(drizzle(client, { schema }))
    console.log(r.created ? `Seed OK : version ${VERSION}, ${questions.length} questions, ${options.length} options` : `Version ${VERSION} déjà présente`)
    await client.end()
  })()
}
