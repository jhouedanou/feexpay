/**
 * Amorçage des comptes admin (décision client du 8 septembre 2026).
 *
 * Crée l'administrateur principal comme utilisateur Supabase sans mot de passe (statut
 * `invited`), puis une invitation maison de 7 jours pour lui et pour chaque autre adresse.
 * Les invitations sont émises au nom de l'administrateur principal. Idempotent : une adresse
 * déjà active est laissée telle quelle, une invitation en attente est remplacée.
 *
 * Les liens d'invitation sont imprimés en sortie : sans domaine d'envoi vérifié, Resend ne
 * délivre qu'au titulaire du compte, il faut donc les transmettre à la main.
 *
 *   nvm use 22 && pnpm tsx scripts/seed-admins.ts
 */
import { createHash, randomBytes } from 'node:crypto'
import pg from 'pg'
import { createClient } from '@supabase/supabase-js'
import { chargerEnv, optionsTls } from './env'

const PRINCIPAL = { email: 'amedeel@feexpay.me', prenom: 'Amédée', nom: 'L.', role: 'admin' }
const AUTRES = [
  'cossi@bigfiveabidjan.com',
  'ghislain@bigfiveabidjan.com',
  'yannick@bigfiveabidjan.com',
  'morel@bigfiveabidjan.com',
  'yannm@feexpay.me',
  'leslies@feexpay.me',
  'fatimec@feexpay.me',
  'jeanhuguesh@feexpay.me',
  'jessicae@feexpay.me',
]

async function main() {
const env = chargerEnv()
const base = env.APP_BASE_URL ?? 'http://localhost:3000'
const sb = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
const client = new pg.Client({ connectionString: env.DATABASE_URL!, ...optionsTls(env.DATABASE_URL!) })
await client.connect()

const sha = (s: string) => createHash('sha256').update(s).digest('hex')
const prenomDepuisEmail = (e: string) => {
  const p = e.split('@')[0]!
  return p.charAt(0).toUpperCase() + p.slice(1)
}

// 1. Administrateur principal : utilisateur Supabase (sans mot de passe) + ligne admin_user.
let principalId: string
const existant = await client.query<{ id: string; status: string }>(`select id, status from admin_user where email = $1`, [PRINCIPAL.email])
if (existant.rows[0]) {
  principalId = existant.rows[0].id
  console.log(`· ${PRINCIPAL.email} déjà présent (${existant.rows[0].status})`)
} else {
  const users = await sb.auth.admin.listUsers({ perPage: 1000 })
  let user = users.data?.users.find((u) => u.email?.toLowerCase() === PRINCIPAL.email)
  if (!user) {
    const r = await sb.auth.admin.createUser({ email: PRINCIPAL.email, email_confirm: true, app_metadata: { role: 'admin' } })
    if (r.error || !r.data.user) throw new Error(`Supabase: ${r.error?.message}`)
    user = r.data.user
  }
  principalId = user.id
  await client.query(
    `insert into admin_user (id, prenom, nom, email, role, status, mfa_required) values ($1,$2,$3,$4,'admin','invited',true)`,
    [principalId, PRINCIPAL.prenom, PRINCIPAL.nom, PRINCIPAL.email],
  )
  console.log(`✓ ${PRINCIPAL.email} créé (Administrateur, invité)`)
}

// 2. Invitations maison, l'administrateur principal comme invitant.
const liens: string[] = []
for (const email of [PRINCIPAL.email, ...AUTRES]) {
  const actif = await client.query(`select 1 from admin_user where email = $1 and status = 'active'`, [email])
  if (actif.rowCount) {
    console.log(`· ${email} déjà actif`)
    continue
  }
  const role = email === PRINCIPAL.email ? 'admin' : 'commercial'
  const token = randomBytes(32).toString('base64url')
  await client.query(`update admin_invitation set status = 'revoked' where email = $1 and status = 'pending'`, [email])
  await client.query(
    `insert into admin_invitation (email, prenom, nom, role, mfa_required, token_hash, inviter_id, expires_at)
     values ($1, $2, '', $3, $4, $5, $6, now() + interval '7 days')`,
    [email, email === PRINCIPAL.email ? PRINCIPAL.prenom : prenomDepuisEmail(email), role, role === 'admin', sha(token), principalId],
  )
  liens.push(`${email}\t${role}\t${base}/admin/invitation/${token}`)
}

await client.query(
  `insert into audit_log (actor_id, action, target_type, target_id, payload_min) values ($1, 'seed.admins', 'admin_user', $2, $3)`,
  [principalId, principalId, JSON.stringify({ invitations: liens.length })],
)
await client.end()

console.log('\nLiens d’invitation (usage unique, 7 jours) :')
for (const l of liens) console.log(l)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
