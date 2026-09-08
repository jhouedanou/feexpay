import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { readFileSync } from 'node:fs'

/** Postgres en mémoire avec le schéma Radar : stub auth.users + migration + rôles Supabase. */
export async function freshDb() {
  const pg = new PGlite({ extensions: { citext } })
  await pg.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users (id uuid primary key);
  `)
  const sql = readFileSync('supabase/migrations/20260905000000_init.sql', 'utf8').replace('create extension if not exists pgcrypto;', '')
  await pg.exec(sql)
  return pg
}
