/**
 * Secrets de la pile Docker, à générer une fois puis à garder dans docker/.env.
 *
 * Les deux « clés Supabase » ne sont pas des clés au sens d'un fournisseur : ce sont des
 * jetons JWT signés avec JWT_SECRET et portant un rôle Postgres dans le claim `role`.
 * PostgREST lit ce rôle pour décider sous quelle identité exécuter la requête, et GoTrue
 * reconnaît `service_role` comme rôle d'administration. C'est exactement ce que fait
 * Supabase hébergé, d'où des clés de même forme.
 *
 *   node docker/scripts/generer-secrets.mjs            # nouveaux secrets
 *   node docker/scripts/generer-secrets.mjs --secret X # jetons pour un secret existant
 *   node docker/scripts/generer-secrets.mjs >> docker/.env
 */
import { createHmac, randomBytes } from 'node:crypto'

const ANNEES = 10

const argv = process.argv.slice(2)
const lireOption = (nom) => {
  const i = argv.indexOf(nom)
  return i >= 0 ? argv[i + 1] : undefined
}

// 40 octets en base64url : au-delà des 32 caractères qu'exige PostgREST pour un secret
// symétrique, et sans caractère à échapper dans un fichier d'environnement.
const aleatoire = (octets = 40) => randomBytes(octets).toString('base64url')

const base64url = (objet) => Buffer.from(JSON.stringify(objet)).toString('base64url')

function jeton(role, secret, emis = Math.floor(Date.now() / 1000)) {
  const entete = base64url({ alg: 'HS256', typ: 'JWT' })
  const charge = base64url({
    iss: 'radar-docker',
    role,
    iat: emis,
    exp: emis + ANNEES * 365 * 24 * 3600,
  })
  const signature = createHmac('sha256', secret).update(`${entete}.${charge}`).digest('base64url')
  return `${entete}.${charge}.${signature}`
}

const secret = lireOption('--secret') ?? aleatoire()

process.stdout.write(
  [
    '# Généré par docker/scripts/generer-secrets.mjs — à conserver hors du dépôt.',
    `JWT_SECRET=${secret}`,
    `SUPABASE_KEY=${jeton('anon', secret)}`,
    `SUPABASE_SERVICE_KEY=${jeton('service_role', secret)}`,
    `POSTGRES_PASSWORD=${aleatoire(24)}`,
    `CRON_SECRET=${aleatoire(24)}`,
    '',
  ].join('\n'),
)
