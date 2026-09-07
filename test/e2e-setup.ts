// Global setup vitest : Postgres WASM en socket TCP, schéma + seed, DATABASE_URL pour le serveur Nuxt.
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../server/db/schema'
import { seed } from '../server/db/seed'
import { freshDb } from './pglite'

export default async function () {
  const db = await freshDb()
  await seed(drizzle(db, { schema }))
  const server = new PGLiteSocketServer({ db, port: 54329, host: '127.0.0.1' })
  await server.start()
  process.env.DATABASE_URL = 'postgres://postgres:postgres@127.0.0.1:54329/postgres'
  return async () => {
    await server.stop()
    await db.close()
  }
}
