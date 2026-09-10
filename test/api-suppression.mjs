/**
 * Smoke test des demandes de suppression de données (RGPD article 17).
 *
 *   nvm use 22 && pnpm dev              # dans un terminal
 *   nvm use 22 && pnpm test:suppression # dans un autre
 *
 * Crée un contact de test, en demande la suppression, la confirme et la fait traiter par un
 * administrateur. Écrit dans la base de DATABASE_URL — ne pas exécuter sur la prod.
 */
import { readFileSync } from 'node:fs'
import { createHash, randomBytes } from 'node:crypto'
import pg from 'pg'
import * as OTPAuth from 'otpauth'

const BASE = process.env.APP_BASE_URL ?? 'http://localhost:3000'
const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => { const i = l.indexOf('='); let v = l.slice(i + 1).trim(); const q = /^(["'])(.*?)\1/.exec(v); v = q ? q[2] : v.replace(/\s+#.*$/, ''); return [l.slice(0, i), v.trim()] }),
)
const db = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
await db.connect()

let fails = 0
const check = (label, cond, detail = '') => { console.log(`${cond ? '✓' : '✗'} ${label}${detail ? ' — ' + detail : ''}`); if (!cond) fails++ }
const sha = (s) => createHash('sha256').update(s).digest('hex')

function session() {
  let cookie = ''
  return async (method, path, body) => {
    const r = await fetch(BASE + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
    for (const c of r.headers.getSetCookie?.() ?? []) if (c.startsWith('radar_admin=')) cookie = c.split(';')[0]
    let data = null
    try { data = await r.json() } catch {}
    return { status: r.status, data }
  }
}

const suffixe = Date.now().toString(36)
const EMAIL = `test-suppression-${suffixe}@exemple.ci`

// Contact de test avec un rapport, comme après un vrai parcours.
const contact = (await db.query(
  `insert into contact (prenom, nom, email_norm, phone_e164, entreprise, secteur, taille)
   values ('Aya','Konan',$1,'+2250700000001','Konan & Fils','Commerce de détail','2 à 5') returning id`, [EMAIL])).rows[0]
const rapport = (await db.query(
  `insert into report (contact_id, snapshot_refs, token_hash, editorial_version)
   values ($1, '{"score_snapshot_ids":[]}', $2, '2.2') returning id`, [contact.id, sha(randomBytes(32).toString('hex'))])).rows[0]
await db.query(`insert into prospect_note (contact_id, author_id, texte) values ($1, (select id from admin_user where role='admin' limit 1), 'note de test')`, [contact.id])
check('contact de test créé, avec rapport et note', Boolean(contact.id && rapport.id))

// 1. Pas d'énumération : même réponse pour une adresse connue et une inconnue.
const inconnu = await session()('POST', '/api/public/deletions', { email: `absent-${suffixe}@exemple.ci` })
const connu = await session()('POST', '/api/public/deletions', { email: EMAIL })
check('adresse inconnue → 200', inconnu.status === 200)
check('adresse connue → 200', connu.status === 200)
check('réponse identique dans les deux cas', inconnu.data?.message === connu.data?.message)
check('aucune demande pour l’adresse inconnue', (await db.query(`select count(*)::int c from deletion_request where email = $1`, [`absent-${suffixe}@exemple.ci`])).rows[0].c === 0)

const demandes = await db.query(`select id, status from deletion_request where email = $1`, [EMAIL])
check('une demande ouverte, en attente de confirmation', demandes.rows.length === 1 && demandes.rows[0].status === 'pending')
check('envoi journalisé', (await db.query(`select count(*)::int c from notification where deletion_request_id = $1`, [demandes.rows[0].id])).rows[0].c === 1)

// 2. Tant que le lien n'est pas ouvert, la demande n'entre pas dans la file.
const file0 = await session()('GET', '/api/admin/suppressions')
check('file admin protégée', file0.status === 401 || file0.status === 403, `statut ${file0.status}`)

// 3. Le jeton : inconnu refusé, valide accepté une seule fois.
const jeton = randomBytes(32).toString('base64url')
await db.query(`update deletion_request set token_hash = $2 where id = $1`, [demandes.rows[0].id, sha(jeton)])
check('jeton inconnu → 404', (await session()('GET', `/api/public/deletions/${randomBytes(32).toString('base64url')}`)).status === 404)
const apercu = await session()('GET', `/api/public/deletions/${jeton}`)
check('jeton valide → adresse masquée', apercu.status === 200 && /…@/.test(apercu.data?.email ?? ''), apercu.data?.email)

const conf = await session()('POST', `/api/public/deletions/${jeton}/confirmer`)
check('confirmation acceptée', conf.status === 200, JSON.stringify(conf.data?.data ?? ''))
check('demande confirmée en base', (await db.query(`select status, contact_id from deletion_request where id = $1`, [demandes.rows[0].id])).rows[0].status === 'verified')
const rejeu = await session()('POST', `/api/public/deletions/${jeton}/confirmer`)
check('jeton à usage unique', rejeu.status === 410 || rejeu.status === 409, `statut ${rejeu.status}`)

// 4. Traitement par un administrateur. Le compte est créé ici : la suite ne dépend d'aucun
// compte laissé par une autre passe.
const ADMIN_EMAIL = `test-suppr-${suffixe}@feexpay.me`
const ADMIN_PWD = `Radar-Suppr-${suffixe}-Ok!!`
const inviter = (await db.query(`select id from admin_user where role = 'admin' limit 1`)).rows[0].id

/** Compte de test du rôle demandé. Le rôle Administrateur exige le second facteur : on l'enrôle. */
async function compte(role, email) {
  const t = randomBytes(32).toString('base64url')
  await db.query(
    `insert into admin_invitation (email, prenom, nom, role, mfa_required, token_hash, inviter_id, expires_at)
     values ($1, 'Test', 'Suppression', $2, $3, $4, $5, now() + interval '1 day')`,
    [email, role, role === 'admin', sha(t), inviter],
  )
  const call = session()
  const acc = await call('POST', '/api/admin/invitations/accept', { token: t, prenom: 'Test', nom: 'Suppression', password: ADMIN_PWD })
  check(`compte ${role} de test connecté`, acc.status === 200, JSON.stringify(acc.data?.data ?? ''))
  if (role === 'admin') {
    const enr = await call('POST', '/api/admin/auth/2fa/enroll')
    const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(enr.data.secret), digits: 6, period: 30 })
    const ver = await call('POST', '/api/admin/auth/2fa/verify', { code: totp.generate(), factorId: enr.data.factorId })
    check('admin de test en aal2', ver.status === 200)
  }
  return call
}

const COM_EMAIL = `test-suppr-com-${suffixe}@feexpay.me`
const commercial = await compte('commercial', COM_EMAIL)
const admin = await compte('admin', ADMIN_EMAIL)
{
  const refuse = await commercial('POST', `/api/admin/suppressions/${demandes.rows[0].id}/traiter`, { action: 'supprimer' })
  check('rôle Commercial refusé sur le traitement', refuse.status === 403, `statut ${refuse.status}`)
  const file = await admin('GET', '/api/admin/suppressions')
  check('la demande confirmée figure dans la file', file.status === 200 && file.data.demandes.some((d) => d.id === demandes.rows[0].id), `statut ${file.status}`)
  const ok = await admin('POST', `/api/admin/suppressions/${demandes.rows[0].id}/traiter`, { action: 'supprimer' })
  check('suppression prononcée', ok.status === 200, JSON.stringify(ok.data?.data ?? ok.data))

  const c = (await db.query(`select prenom, nom, email_norm::text, phone_e164, entreprise from contact where id = $1`, [contact.id])).rows[0]
  check('identité effacée', c.prenom === 'Supprimé' && c.nom === 'Supprimé' && c.phone_e164 === null && c.entreprise === null, JSON.stringify(c))
  check('adresse remplacée', c.email_norm.endsWith('@invalide.local'), c.email_norm)
  check('rapports révoqués', (await db.query(`select count(*)::int c from report where contact_id = $1 and status = 'revoked'`, [contact.id])).rows[0].c === 1)
  check('notes internes effacées', (await db.query(`select count(*)::int c from prospect_note where contact_id = $1`, [contact.id])).rows[0].c === 0)
  check('demande close', (await db.query(`select status from deletion_request where id = $1`, [demandes.rows[0].id])).rows[0].status === 'done')
  check('journal d’audit alimenté', (await db.query(`select count(*)::int c from audit_log where action like 'deletion.%' and target_id = $1`, [contact.id])).rows[0].c >= 2)
}

// --- Nettoyage. La ligne admin_user reste, révoquée : `audit_log` la référence.
for (const e of [ADMIN_EMAIL, COM_EMAIL]) {
  await db.query(`update admin_user set status = 'revoked', role = 'lecture' where email = $1`, [e])
  await db.query(`delete from admin_recovery_code where admin_user_id = (select id from admin_user where email = $1)`, [e])
  await db.query(`delete from admin_invitation where email = $1`, [e])
}
await db.query(`delete from notification where deletion_request_id in (select id from deletion_request where email like $1)`, [`%${suffixe}%`])
await db.query(`delete from deletion_request where email like $1`, [`%${suffixe}%`])
await db.query(`delete from report where contact_id = $1`, [contact.id])
await db.query(`delete from contact where id = $1`, [contact.id])

await db.end()
console.log(fails ? `\n${fails} contrôle(s) en échec.` : '\nTous les contrôles passent.')
process.exit(fails ? 1 : 0)
