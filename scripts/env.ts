import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Environnement des scripts : le `.env` du dépôt, surchargé par celui du processus.
 * Le fichier est facultatif — dans un conteneur, tout arrive par l'environnement.
 * Pas de dotenv : le dépôt n'embarque aucune dépendance pour ça.
 */
export function chargerEnv(): Record<string, string> {
  const out: Record<string, string> = {}
  let raw = ''
  try {
    raw = readFileSync(join(racine, '.env'), 'utf8')
  } catch {
    // Pas de .env : tout vient de l'environnement.
  }
  for (const line of raw.split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (!m) continue
    let value = m[2]!.trim()
    if (value.startsWith('"')) value = value.slice(1, value.indexOf('"', 1))
    else if (value.startsWith("'")) value = value.slice(1, value.indexOf("'", 1))
    else value = value.split('#')[0]!.trim()
    out[m[1]!] = value
  }
  return { ...out, ...(process.env as Record<string, string>) }
}

/**
 * Options TLS de `pg`. TLS par défaut sans vérification du certificat, comme l'exige
 * Supabase ; `sslmode=disable` dans l'URL le coupe, pour un Postgres de conteneur qui
 * écoute en clair. Même règle que server/utils/db.ts.
 */
export function optionsTls(url: string): { ssl?: { rejectUnauthorized: boolean } } {
  return /[?&]sslmode=disable(&|$)/.test(url) ? {} : { ssl: { rejectUnauthorized: false } }
}
