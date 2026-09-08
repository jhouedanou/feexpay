/**
 * Smoke test de l'admin (Lot 4) contre `pnpm dev` : acceptation d'invitation, connexion,
 * refus sans second facteur, enrôlement TOTP, RBAC, garde du dernier admin, invitation expirée.
 *
 *   nvm use 22 && node test/api-admin.mjs
 *
 * Crée des comptes de test `test-admin-*@feexpay.me` en base et chez Supabase ; ne pas
 * exécuter sur la prod. Lit .env pour DATABASE_URL (insertion directe des invitations).
 */
import { readFileSync } from 'node:fs'
import { createHash, randomBytes } from 'node:crypto'
import pg from 'pg'
import * as OTPAuth from 'otpauth'
import { createClient } from '@supabase/supabase-js'

const BASE = process.env.APP_BASE_URL ?? 'http://localhost:3000'
const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => { const i = l.indexOf('='); let v = l.slice(i + 1).trim(); const q = /^(["'])(.*?)\1/.exec(v); v = q ? q[2] : v.replace(/\s+#.*$/, ''); return [l.slice(0, i), v.trim()] }),
)
const db = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
await db.connect()
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

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

// --- Nettoyage des comptes de test précédents ---------------------------------
const suffixe = Date.now().toString(36)
const ADMIN = `test-admin-${suffixe}@feexpay.me`
const COM = `test-com-${suffixe}@feexpay.me`
const PWD = `Radar-Test-${suffixe}-Ok!!`

const seedRow = await db.query(`select id from admin_user where role = 'admin' limit 1`)
const inviterId = seedRow.rows[0]?.id
check('un administrateur amorcé existe', Boolean(inviterId))

async function invitation(email, role, expiree = false) {
  const token = randomBytes(32).toString('base64url')
  await db.query(
    `insert into admin_invitation (email, prenom, nom, role, mfa_required, token_hash, inviter_id, expires_at)
     values ($1, 'Test', 'Compte', $2, $3, $4, $5, now() + interval '${expiree ? '-1 day' : '7 days'}')`,
    [email, role, role === 'admin', sha(token), inviterId],
  )
  return token
}

// 1. Invitation expirée refusée
const tExp = await invitation(`test-exp-${suffixe}@feexpay.me`, 'lecture', true)
const exp = await session()('POST', '/api/admin/invitations/accept', { token: tExp, prenom: 'A', nom: 'B', password: PWD })
check('invitation expirée refusée (410)', exp.status === 410, exp.data?.data?.code)

// 2. Acceptation admin + refus sans 2FA
const adminCall = session()
const tAdmin = await invitation(ADMIN, 'admin')
const faible = await adminCall('POST', '/api/admin/invitations/accept', { token: tAdmin, prenom: 'Test', nom: 'Admin', password: 'password1234' })
check('mot de passe compromis refusé', faible.status === 400, faible.data?.data?.message)
const acc = await adminCall('POST', '/api/admin/invitations/accept', { token: tAdmin, prenom: 'Test', nom: 'Admin', password: PWD })
check('invitation admin acceptée', acc.status === 200 && acc.data?.role === 'admin', JSON.stringify(acc.data?.data ?? acc.data))
const rejeu = await session()('POST', '/api/admin/invitations/accept', { token: tAdmin, prenom: 'Test', nom: 'Admin', password: PWD })
check('jeton à usage unique', rejeu.status === 410)

const sans2fa = await adminCall('GET', '/api/admin/users')
check('admin sans second facteur refusé (MFA_REQUIRED)', sans2fa.status === 403 && sans2fa.data?.data?.code === 'MFA_REQUIRED', sans2fa.data?.data?.code)

// 3. Enrôlement TOTP
const enr = await adminCall('POST', '/api/admin/auth/2fa/enroll')
check('enrôlement TOTP démarré', enr.status === 200 && typeof enr.data?.secret === 'string')
const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(enr.data.secret), digits: 6, period: 30 })
const ver = await adminCall('POST', '/api/admin/auth/2fa/verify', { code: totp.generate(), factorId: enr.data.factorId })
check('code TOTP accepté, codes de récupération remis', ver.status === 200 && ver.data?.codesRecuperation?.length === 10, JSON.stringify(ver.data?.data ?? ''))
const me = await adminCall('GET', '/api/admin/auth/me')
check('aal2 après vérification', me.data?.aal === 'aal2', me.data?.aal)
const liste = await adminCall('GET', '/api/admin/users')
check('liste des comptes accessible à l’admin', liste.status === 200 && Array.isArray(liste.data?.comptes))

// 4. Reconnexion : mot de passe puis TOTP
const login2 = session()
const l1 = await login2('POST', '/api/admin/auth/login', { email: ADMIN, password: 'mauvais-mot-de-passe' })
check('mauvais mot de passe refusé avec tentatives restantes', l1.status === 401 && /tentative/.test(l1.data?.data?.message ?? ''), l1.data?.data?.message)
const l2 = await login2('POST', '/api/admin/auth/login', { email: ADMIN, password: PWD })
check('connexion par mot de passe', l2.status === 200 && l2.data?.mfa?.requise === true && l2.data?.mfa?.enrolee === true)
const l3 = await login2('POST', '/api/admin/auth/2fa/verify', { code: totp.generate() })
check('second facteur à la reconnexion', l3.status === 200)

// 5. Invitation d'un commercial par l'API, acceptation, RBAC
const inv = await adminCall('POST', '/api/admin/invitations', { email: COM, prenom: 'Test', nom: 'Com', role: 'commercial', team: 'Test' })
check('invitation créée par l’admin (201)', inv.status === 201 && typeof inv.data?.lien === 'string', JSON.stringify(inv.data?.data ?? ''))
const tCom = inv.data.lien.split('/').pop()
const comCall = session()
const accCom = await comCall('POST', '/api/admin/invitations/accept', { token: tCom, prenom: 'Test', nom: 'Com', password: PWD })
check('commercial accepté et connecté', accCom.status === 200)
const meCom = await comCall('GET', '/api/admin/auth/me')
check('commercial sans obligation de 2FA', meCom.data?.mfa?.requise === false)
const refus = await comCall('GET', '/api/admin/users')
check('commercial refusé sur les comptes (FORBIDDEN_SCOPE)', refus.status === 403 && refus.data?.data?.code === 'FORBIDDEN_SCOPE')
const refusInv = await comCall('POST', '/api/admin/invitations', { email: `x-${suffixe}@feexpay.me`, prenom: 'X', nom: 'Y', role: 'lecture' })
check('commercial refusé sur l’invitation', refusInv.status === 403)
const externe = await adminCall('POST', '/api/admin/invitations', { email: `x-${suffixe}@gmail.com`, prenom: 'X', nom: 'Y', role: 'lecture' })
check('adresse hors domaines refusée', externe.status === 400)

// 6. Gardes : auto-rétrogradation et dernier admin
const moi = await adminCall('PATCH', `/api/admin/users/${me.data.user.id}`, { role: 'lecture' })
check('auto-rétrogradation refusée', moi.status === 403)
const comId = meCom.data.user.id
const susp = await adminCall('PATCH', `/api/admin/users/${comId}`, { status: 'suspended' })
check('suspension d’un commercial', susp.status === 200)
const apres = await comCall('GET', '/api/admin/auth/me')
check('session du suspendu coupée', apres.status === 401 || apres.data?.user?.status === 'suspended')

const admins = await db.query(`select count(*)::int as n from admin_user where role = 'admin' and status = 'active'`)
if (admins.rows[0].n === 1) {
  const last = await adminCall('PATCH', `/api/admin/users/${me.data.user.id}`, { status: 'suspended' })
  check('dernier admin protégé', last.status === 403 || last.status === 409, last.data?.data?.code)
} else {
  console.log(`· dernier admin non testé (${admins.rows[0].n} admins actifs)`)
}

const audit = await db.query(`select count(*)::int as n from audit_log where actor_id = $1`, [me.data.user.id])
check('journal d’audit alimenté', audit.rows[0].n >= 4, `${audit.rows[0].n} entrées`)

// --- Nettoyage : invitations, codes, utilisateurs Supabase. Les lignes admin_user restent,
// révoquées : audit_log est immuable et référence l'acteur, la suppression est refusée.
await db.query(`delete from admin_invitation where email like 'test-%-${suffixe}@%' or email like 'x-${suffixe}@%'`)
for (const email of [ADMIN, COM]) {
  const r = await db.query(`select id from admin_user where email = $1`, [email])
  if (!r.rows[0]) continue
  const id = r.rows[0].id
  await db.query(`update admin_user set status = 'revoked', role = 'lecture' where id = $1`, [id])
  await db.query(`delete from admin_invitation where inviter_id = $1`, [id])
  await db.query(`delete from admin_recovery_code where admin_user_id = $1`, [id])
  await sb.auth.admin.deleteUser(id).catch(() => null)
}
await db.end()

console.log(fails ? `\n${fails} contrôle(s) en échec.` : '\nTous les contrôles passent.')
process.exit(fails ? 1 : 0)
