/**
 * Écrit `openapi.json` à la racine depuis le schéma que Nitro expose en développement
 * (PLAN.md §2, livrable H.2). Le fichier est commité : la description de l'API doit
 * pouvoir être lue sans lancer le serveur.
 *
 *   nvm use 22 && pnpm dev      # dans un terminal
 *   nvm use 22 && pnpm openapi  # dans un autre
 *
 * Les routes internes de Nuxt (îlots, page d'erreur, visionneuses du schéma) sont
 * retirées : elles ne font pas partie du contrat.
 */
import { writeFileSync } from 'node:fs'

const BASE = process.env.APP_BASE_URL ?? 'http://localhost:3000'
const INTERNES = /^\/(_|__nuxt|$)/

const r = await fetch(`${BASE}/_openapi.json`)
if (!r.ok) {
  console.error(`Schéma indisponible (${r.status}). Le serveur de développement est-il lancé sur ${BASE} ?`)
  process.exit(1)
}
const schema = await r.json()

const paths = Object.fromEntries(
  Object.entries(schema.paths ?? {})
    .filter(([p]) => p.startsWith('/api/') && !INTERNES.test(p))
    .sort(([a], [b]) => a.localeCompare(b)),
)

const sortie = {
  ...schema,
  info: {
    title: 'Radar by FeexPay — API',
    version: process.env.npm_package_version ?? '1.0.0',
    description: [
      'Contrat des routes serveur (PLAN.md §6).',
      '',
      '`/api/public/**` : parcours public. La session est portée par le cookie httpOnly',
      '`radar_sid` ; les jetons de participation et de rapport sont opaques et seul leur',
      'condensat est conservé en base.',
      '',
      '`/api/admin/**` : espace interne. Cookie httpOnly `radar_admin`, second facteur exigé',
      'pour les rôles Analyste et Administrateur, rôle vérifié par chaque handler.',
      '',
      '`/api/cron/**` : tâches planifiées, jeton porté par l’en-tête Authorization.',
      '',
      'Les erreurs métier portent un code stable dans `data.code` (voir server/utils/errors.ts)',
      'et le `correlation_id` de la requête.',
    ].join('\n'),
  },
  servers: [{ url: 'https://radar.feexpay.me', description: 'Production' }, { url: 'http://localhost:3000', description: 'Développement' }],
  paths,
}

writeFileSync('openapi.json', `${JSON.stringify(sortie, null, 2)}\n`)
console.log(`openapi.json écrit — ${Object.keys(paths).length} chemins.`)
