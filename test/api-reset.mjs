/**
 * Smoke test de la réinitialisation du mot de passe administrateur (PLAN.md §10.5).
 *
 *   nvm use 22 && pnpm dev        # dans un terminal
 *   nvm use 22 && pnpm test:reset # dans un autre
 *
 * Réutilise toujours le même compte de test `test-reset@feexpay.me`, remis en service à
 * chaque passe : les comptes de test ne se multiplient pas d'une exécution à l'autre.
 * Ne pas exécuter sur la prod. Lit .env pour DATABASE_URL.
 */
import { readFileSync } from 'node:fs'
import { createHash, randomBytes } from 'node:crypto'
import pg from 'pg'

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

// --- Compte de test : rôle « commercial », sans second facteur imposé ----------
const suffixe = Date.now().toString(36)
const EMAIL = 'test-reset@feexpay.me'
const PWD1 = `Radar-Reset-${suffixe}-Un!!`
const PWD2 = `Radar-Reset-${suffixe}-Deux!!`

const inviterId = (await db.query(`select id from admin_user where role = 'admin' limit 1`)).rows[0]?.id
check('un administrateur amorcé existe', Boolean(inviterId))

// Restes d'une passe précédente : l'invitation est rejouée sur la même ligne admin_user.
await db.query(`delete from admin_invitation where email = $1`, [EMAIL])
const resteAncien = (await db.query(`select id from admin_user where email = $1`, [EMAIL])).rows[0]
if (resteAncien) {
  await db.query(`delete from notification where admin_password_reset_id in (select id from admin_password_reset where admin_user_id = $1)`, [resteAncien.id])
  await db.query(`delete from admin_password_reset where admin_user_id = $1`, [resteAncien.id])
}

const tokenInv = randomBytes(32).toString('base64url')
await db.query(
  `insert into admin_invitation (email, prenom, nom, role, token_hash, inviter_id, expires_at)
   values ($1, 'Test', 'Reset', 'commercial', $2, $3, now() + interval '7 days')`,
  [EMAIL, sha(tokenInv), inviterId],
)
const compte = session()
const acc = await compte('POST', '/api/admin/invitations/accept', { token: tokenInv, prenom: 'Test', nom: 'Reset', password: PWD1 })
check('compte de test créé', acc.status === 200, JSON.stringify(acc.data?.data ?? acc.data))
const userId = (await db.query(`select id from admin_user where email = $1`, [EMAIL])).rows[0]?.id

// 1. Pas d'énumération de comptes : même réponse dans les deux cas.
const inconnu = await session()('POST', '/api/admin/auth/reset', { email: `absent-${suffixe}@feexpay.me` })
const connu = await session()('POST', '/api/admin/auth/reset', { email: EMAIL })
check('adresse inconnue → 200', inconnu.status === 200)
check('adresse connue → 200', connu.status === 200)
check('réponse identique dans les deux cas', inconnu.data?.message === connu.data?.message)

const demandes = await db.query(`select id, used_at from admin_password_reset where admin_user_id = $1`, [userId])
check('une demande ouverte en base pour le compte connu', demandes.rows.length === 1)
check('aucune demande pour l’adresse inconnue', (await db.query(`select count(*)::int c from admin_password_reset p join admin_user u on u.id = p.admin_user_id where u.email like $1`, [`absent-${suffixe}%`])).rows[0].c === 0)
check('envoi journalisé dans notification', (await db.query(`select count(*)::int c from notification where admin_password_reset_id = $1`, [demandes.rows[0].id])).rows[0].c === 1)

// 2. Une nouvelle demande périme la précédente.
const jeton1 = randomBytes(32).toString('base64url')
await db.query(`update admin_password_reset set token_hash = $2 where id = $1`, [demandes.rows[0].id, sha(jeton1)])
await session()('POST', '/api/admin/auth/reset', { email: EMAIL })
const apres = await db.query(`select id, used_at from admin_password_reset where admin_user_id = $1 order by created_at`, [userId])
check('la demande précédente est close', apres.rows.length === 2 && apres.rows[0].used_at !== null)
const perime = await session()('POST', '/api/admin/auth/reset/confirm', { token: jeton1, password: PWD2 })
check('jeton périmé refusé (410)', perime.status === 410, perime.data?.data?.code)

// 3. Jeton courant : contrôle de validité puis application.
const jeton2 = randomBytes(32).toString('base64url')
await db.query(`update admin_password_reset set token_hash = $2 where id = $1`, [apres.rows[1].id, sha(jeton2)])

const inconnuJeton = await session()('GET', `/api/admin/auth/reset/${randomBytes(32).toString('base64url')}`)
check('jeton inconnu → 404', inconnuJeton.status === 404)
const apercu = await session()('GET', `/api/admin/auth/reset/${jeton2}`)
check('jeton valide → prénom renvoyé', apercu.status === 200 && apercu.data?.prenom === 'Test')

const court = await session()('POST', '/api/admin/auth/reset/confirm', { token: jeton2, password: 'court' })
check('mot de passe trop court refusé', court.status === 400, court.data?.data?.message)
const compromis = await session()('POST', '/api/admin/auth/reset/confirm', { token: jeton2, password: 'password1234' })
check('mot de passe des fuites connues refusé', compromis.status === 400, compromis.data?.data?.message)

// La session ouverte avec l'ancien mot de passe doit tomber.
const avant = await compte('GET', '/api/admin/auth/me')
check('session ouverte avant réinitialisation', avant.status === 200)

const ok = await session()('POST', '/api/admin/auth/reset/confirm', { token: jeton2, password: PWD2 })
check('nouveau mot de passe accepté', ok.status === 200, JSON.stringify(ok.data?.data ?? ok.data))

const rejeu = await session()('POST', '/api/admin/auth/reset/confirm', { token: jeton2, password: PWD2 })
check('jeton à usage unique', rejeu.status === 410, rejeu.data?.data?.code)

const apresReset = await compte('GET', '/api/admin/auth/me')
check('sessions précédentes coupées', apresReset.status === 401, `statut ${apresReset.status}`)

// 4. Ancien et nouveau mot de passe.
const ancien = await session()('POST', '/api/admin/auth/login', { email: EMAIL, password: PWD1 })
check('ancien mot de passe refusé', ancien.status === 401)
const nouveau = session()
const co = await nouveau('POST', '/api/admin/auth/login', { email: EMAIL, password: PWD2 })
check('connexion avec le nouveau mot de passe', co.status === 200, JSON.stringify(co.data?.data ?? ''))
check('compteur d’échecs remis à zéro', (await db.query(`select failed_logins from admin_user where id = $1`, [userId])).rows[0].failed_logins === 0)

// 4 bis. Changement de mot de passe par un administrateur connecté.
// Le contrôle décisif est la reconnexion : le 10 septembre, le changement avait « réussi »
// sans que personne ne vérifie que le nouveau mot de passe ouvrait une session, et le compte
// s'est retrouvé avec un mot de passe que personne ne connaissait.
const PWD3 = `Radar-Reset-${suffixe}-Trois!!`
const chg = async (body) => nouveau('POST', '/api/admin/auth/password', body)

const mauvaisActuel = await chg({ actuel: `${PWD2}-faux`, nouveau: PWD3 })
check('changement : mot de passe actuel faux refusé', mauvaisActuel.status === 401, mauvaisActuel.data?.data?.code)
const memeMdp = await chg({ actuel: PWD2, nouveau: PWD2 })
check('changement : mot de passe identique refusé', memeMdp.status === 400, memeMdp.data?.data?.message)
const faible = await chg({ actuel: PWD2, nouveau: 'password1234' })
check('changement : mot de passe compromis refusé', faible.status === 400, faible.data?.data?.message)

const chgOk = await chg({ actuel: PWD2, nouveau: PWD3 })
check('changement accepté', chgOk.status === 200, JSON.stringify(chgOk.data?.data ?? chgOk.data))
check('la session courante survit au changement', (await nouveau('GET', '/api/admin/auth/me')).status === 200)

// Le contrôle qui manquait.
const co3 = await session()('POST', '/api/admin/auth/login', { email: EMAIL, password: PWD3 })
check('connexion effective avec le mot de passe changé', co3.status === 200, JSON.stringify(co3.data?.data ?? ''))
const co2 = await session()('POST', '/api/admin/auth/login', { email: EMAIL, password: PWD2 })
check('mot de passe précédent refusé', co2.status === 401)
await db.query(`update admin_user set failed_logins = 0, locked_until = null where id = $1`, [userId])
check('changement journalisé', (await db.query(`select count(*)::int c from audit_log where target_id = $1 and action = 'password.change.done'`, [userId])).rows[0].c >= 1)

// 5. Compte suspendu : pas de lien envoyé.
await db.query(`update admin_user set status = 'suspended' where id = $1`, [userId])
const avantSuspension = (await db.query(`select count(*)::int c from admin_password_reset where admin_user_id = $1`, [userId])).rows[0].c
await session()('POST', '/api/admin/auth/reset', { email: EMAIL })
check('compte suspendu : aucune demande créée', (await db.query(`select count(*)::int c from admin_password_reset where admin_user_id = $1`, [userId])).rows[0].c === avantSuspension)

check('journal d’audit alimenté', (await db.query(`select count(*)::int c from audit_log where target_id = $1 and action like 'password.reset%'`, [userId])).rows[0].c >= 3)

// --- Nettoyage : la ligne admin_user reste, révoquée. `audit_log` est immuable et
// référence l'acteur : sa suppression est refusée par le trigger (même choix qu'api-admin).
await db.query(`delete from notification where admin_password_reset_id in (select id from admin_password_reset where admin_user_id = $1)`, [userId])
await db.query(`delete from admin_password_reset where admin_user_id = $1`, [userId])
await db.query(`delete from admin_invitation where email = $1`, [EMAIL])
await db.query(`update admin_user set status = 'revoked', role = 'lecture' where id = $1`, [userId])

await db.end()
console.log(fails ? `\n${fails} contrôle(s) en échec.` : '\nTous les contrôles passent.')
process.exit(fails ? 1 : 0)
