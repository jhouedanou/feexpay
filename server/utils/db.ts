import pg from 'pg'

let pool: pg.Pool | undefined

/**
 * Pool Postgres partagé. Accès serveur uniquement, via la connexion directe :
 * les tables métier sont en RLS deny-all, aucun accès client direct (CDC F.1).
 */
export function db(): pg.Pool {
  if (pool) return pool
  const { databaseUrl } = useRuntimeConfig()
  if (!databaseUrl) throw new Error('DATABASE_URL manquant')
  pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
  })
  return pool
}

/** Exécute `fn` dans une transaction, rollback sur exception. */
export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await db().connect()
  try {
    await client.query('begin')
    const out = await fn(client)
    await client.query('commit')
    return out
  } catch (err) {
    await client.query('rollback').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}
