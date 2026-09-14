import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { readFileSync, readdirSync } from 'node:fs'

/** Postgres en mémoire avec le schéma Radar : stub auth.users + migration + rôles Supabase. */
export async function freshDb() {
  const pg = new PGlite({ extensions: { citext } })
  await pg.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users (id uuid primary key);
  `)
  // Toutes les migrations, dans l'ordre des noms de fichiers.
  for (const f of readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(`supabase/migrations/${f}`, 'utf8').replace('create extension if not exists pgcrypto;', '')
    await pg.exec(sql)
  }
  return pg
}
