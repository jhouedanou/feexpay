import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDb() {
  if (_db) return _db
  const url = useRuntimeConfig().databaseUrl || process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL manquant')
  // Pooler Supabase en transaction mode : prepare=false obligatoire.
  const client = postgres(url, { prepare: false, max: 10 })
  _db = drizzle(client, { schema })
  return _db
}
export { schema }
