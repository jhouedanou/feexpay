/**
 * Smoke test de l'admin métier (Lot 5) contre `pnpm dev` : dashboard, liste des prospects avec
 * filtres, fiche (A04/A05), suivi et note, participation (A06), leviers, exports journalisés,
 * refus de l'export sans autorisation.
 *
 *   nvm use 22 && node test/api-metier.mjs
 *
 * Crée un compte `test-com-*@feexpay.me` (Commercial, export autorisé) puis le révoque.
 */
import { readFileSync } from 'node:fs'
import { createHash, randomBytes } from 'node:crypto'
import pg from 'pg'
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
  return async (method, path, body, raw = false) => {
    const r = await fetch(BASE + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
    for (const c of r.headers.getSetCookie?.() ?? []) if (c.startsWith('radar_admin=')) cookie = c.split(';')[0]
    if (raw) return { status: r.status, text: await r.text(), type: r.headers.get('content-type') ?? '', cd: r.headers.get('content-disposition') ?? '' }
    let data = null
    try { data = await r.json() } catch {}
    return { status: r.status, data }
  }
}

const suffixe = Date.now().toString(36)
const COM = `test-com-${suffixe}@feexpay.me`
const PWD = `Radar-Test-${suffixe}-Ok!!`
const inviter = await db.query(`select id from admin_user where role = 'admin' limit 1`)
const token = randomBytes(32).toString('base64url')
await db.query(
  `insert into admin_invitation (email, prenom, nom, role, mfa_required, export_allowed, token_hash, inviter_id, expires_at)
   values ($1, 'Test', 'Métier', 'commercial', false, true, $2, $3, now() + interval '7 days')`,
  [COM, sha(token), inviter.rows[0].id],
)
const call = session()
const acc = await call('POST', '/api/admin/invitations/accept', { token, prenom: 'Test', nom: 'Métier', password: PWD })
check('commercial de test connecté', acc.status === 200, JSON.stringify(acc.data?.data ?? ''))
const me = await call('GET', '/api/admin/auth/me')
check('export autorisé sur le compte de test', me.data?.user?.export_allowed === true)

// A02
const dash = await call('GET', '/api/admin/dashboard?jours=90')
check('dashboard : indicateurs et blocs', dash.status === 200 && dash.data.kpi?.actuel && dash.data.entonnoir?.length === 4 && dash.data.archetypes?.length === 8 && dash.data.croisees?.length === 4, JSON.stringify(dash.data?.data ?? dash.data?.kpi?.actuel))
const dashCsv = await call('GET', '/api/admin/dashboard/export?jours=90', undefined, true)
check('export dashboard CSV', dashCsv.status === 200 && dashCsv.type.includes('text/csv') && dashCsv.text.includes('Participants uniques'))

// A03
const liste = await call('GET', '/api/admin/prospects?page=1&taille=5')
check('liste des prospects paginée', liste.status === 200 && Array.isArray(liste.data.items) && liste.data.items.length <= 5, `${liste.data?.total} au total`)
const g3 = await call('GET', '/api/admin/prospects?gravite=3')
check('filtre gravité élevée : toutes les lignes ont une difficulté ≥ 3', g3.status === 200 && g3.data.items.every((p) => p.difficulte && p.difficulte.gravite >= 3), `${g3.data?.total} lignes`)
const deux = await call('GET', '/api/admin/prospects?deux=1')
check('filtre deux diagnostics', deux.status === 200 && deux.data.items.every((p) => p.deux), `${deux.data?.total} lignes`)
const rien = await call('GET', `/api/admin/prospects?q=aucun-contact-${suffixe}`)
check('recherche sans résultat renvoie 0', rien.status === 200 && rien.data.total === 0)
const csv = await call('GET', '/api/admin/prospects/export?deux=1', undefined, true)
check('export prospects CSV journalisé', csv.status === 200 && csv.type.includes('text/csv') && csv.text.split('\r\n').length === (deux.data.total + 1))

// A04 / A05
const cible = deux.data.items[0] ?? liste.data.items[0]
check('un contact disponible pour la fiche', Boolean(cible))
if (cible) {
  const fiche = await call('GET', `/api/admin/prospects/${cible.id}`)
  check('fiche prospect complète', fiche.status === 200 && fiche.data.contact && fiche.data.priorite?.niveau && Array.isArray(fiche.data.constats) && Array.isArray(fiche.data.leviers) && fiche.data.angle?.length === 4, `${fiche.status} ${JSON.stringify(fiche.data?.data ?? fiche.data?.message ?? '').slice(0, 400)}`)
  if (fiche.status !== 200) { console.log(JSON.stringify(fiche.data).slice(0, 1500)); process.exit(1) }
  if (fiche.data?.deux) check('lecture croisée présente pour deux diagnostics', fiche.data.croisement?.code && fiche.data.dirigeant && fiche.data.rayonnement)
  const tri = fiche.data.constats.every((c, i, a) => i === 0 || a[i - 1].gravite >= c.gravite)
  check('constats triés par gravité décroissante', tri)
  const levOk = fiche.data.leviers.every((l) => l.traite.length || l.support.length)
  check('leviers rattachés à au moins un constat', levOk)
  const suivi = await call('PATCH', `/api/admin/prospects/${cible.id}/suivi`, { statut: 'en_cours', assigneeId: me.data.user.id })
  check('suivi commercial enregistré', suivi.status === 200)
  const note = await call('POST', `/api/admin/prospects/${cible.id}/notes`, { texte: `Note de test ${suffixe}` })
  check('note interne ajoutée', note.status === 200 && note.data.id)
  const fiche2 = await call('GET', `/api/admin/prospects/${cible.id}`)
  check('fiche relue : statut et note présents', fiche2.data.suivi.statut === 'en_cours' && fiche2.data.suivi.assigneeId === me.data.user.id && fiche2.data.notes.some((n) => n.texte.includes(suffixe)))
  const pdf = await call('GET', `/api/admin/prospects/${cible.id}/fiche?vue=entretien`, undefined, true)
  check('fiche entretien PDF', pdf.status === 200 && pdf.type.includes('application/pdf') && pdf.text.startsWith('%PDF'))
  const pdf2 = await call('GET', `/api/admin/prospects/${cible.id}/fiche?vue=synthese`, undefined, true)
  check('fiche synthèse PDF', pdf2.status === 200 && pdf2.text.startsWith('%PDF'))
  if (fiche.data.rapports.length) {
    const renvoi = await call('POST', `/api/admin/prospects/${cible.id}/rapport`)
    check('renvoi du rapport (jeton renouvelé, envoi tenté)', renvoi.status === 200 && renvoi.data.reportId, JSON.stringify(renvoi.data?.email ?? renvoi.data?.data))
  }
  // A06
  const part = fiche.data.participations.find((p) => p.status === 'completed')
  const detail = await call('GET', `/api/admin/participations/${part.id}`)
  check('détail de participation : réponses ordonnées et résultat', detail.status === 200 && detail.data.reponses.length >= 7 && detail.data.resultat && /^PRT-\d{4}-[0-9A-F]{6}$/.test(detail.data.identifiant), detail.data?.identifiant)
  check('réponses déclenchant un constat marquées', detail.data.reponses.some((r) => r.declenche) === fiche.data.constats.some((c) => c.diagnostic === part.diagnostic_type))
  const json = await call('GET', `/api/admin/participations/${part.id}/export`, undefined, true)
  check('export des réponses JSON', json.status === 200 && json.type.includes('json') && json.cd.includes(detail.data.identifiant))
  const hist = await call('GET', `/api/admin/prospects/${cible.id}`)
  check('historique alimenté par les actions admin', hist.data.historique.some((h) => h.action === 'prospect.note'))
}
const parts = await call('GET', '/api/admin/participations?status=completed&taille=5')
check('liste des participations', parts.status === 200 && parts.data.items.every((p) => p.status === 'completed'))
const inconnue = await call('GET', '/api/admin/participations/00000000-0000-0000-0000-000000000000')
check('participation inconnue : 404', inconnue.status === 404)

// Leviers : lecture ouverte, écriture réservée à l'admin
const lev = await call('GET', '/api/admin/leviers')
check('leviers lus : trois leviers initiaux et dimensions de constat', lev.status === 200 && lev.data.leviers.length >= 3 && lev.data.dimensions.length > 5)
const put = await call('PUT', '/api/admin/leviers', { leviers: lev.data.leviers })
check('écriture des leviers refusée au commercial', put.status === 403)

// Export refusé sans autorisation
await db.query(`update admin_user set export_allowed = false where email = $1`, [COM])
const refus = await call('GET', '/api/admin/prospects/export', undefined, true)
check('export refusé quand export_allowed est faux', refus.status === 403)
const jobs = await db.query(`select count(*)::int as n from export_job j join admin_user u on u.id = j.author_id where u.email = $1`, [COM])
check('exports journalisés dans export_job', jobs.rows[0].n >= 5, `${jobs.rows[0].n} lignes`)

// Nettoyage
await db.query(`delete from admin_invitation where email = $1`, [COM])
const r = await db.query(`select id from admin_user where email = $1`, [COM])
if (r.rows[0]) {
  await db.query(`update prospect_suivi set assignee_id = null, updated_by = null where assignee_id = $1 or updated_by = $1`, [r.rows[0].id])
  await db.query(`update admin_user set status = 'revoked', role = 'lecture' where id = $1`, [r.rows[0].id])
  await sb.auth.admin.deleteUser(r.rows[0].id).catch(() => null)
}
await db.end()
console.log(fails ? `\n${fails} contrôle(s) en échec.` : '\nTous les contrôles passent.')
process.exit(fails ? 1 : 0)
