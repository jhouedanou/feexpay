/**
 * Smoke test de la conversion (PLAN.md §9, Lot 3 étape 12) : rapprochement de contact,
 * ouverture du rapport, lecture croisée, idempotence. Exige `pnpm dev`.
 *
 *   nvm use 22 && pnpm test:leads
 *
 * Écrit dans la base pointée par DATABASE_URL — ne pas exécuter sur la prod.
 */
const BASE = process.env.APP_BASE_URL ?? 'http://localhost:3000'
let cookie = ''
let fails = 0

async function call(method, path, body, headers = {}) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...headers, ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  for (const c of r.headers.getSetCookie?.() ?? []) {
    if (c.startsWith('radar_sid=')) cookie = c.split(';')[0]
  }
  let data
  try { data = await r.json() } catch { data = null }
  return { status: r.status, data }
}

function check(label, cond, detail = '') {
  console.log(`${cond ? '✓' : '✗'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!cond) fails++
}

async function run(type, letters) {
  const p = await call('POST', '/api/public/participations', { type })
  const token = p.data.token
  const prefix = type === 'dirigeant' ? 'Q' : 'R'
  for (let i = 0; i < letters.length; i++) {
    const qc = `${prefix}${i + 1}`
    await call('PUT', `/api/public/participations/${token}/answers/${qc}`, {
      optionCode: qc + letters[i],
    })
  }
  await call('POST', `/api/public/participations/${token}/complete`)
  return token
}

const suffixe = Date.now()
const email = `test.${suffixe}@exemple.ci`
const lead = {
  prenom: 'Aya',
  nom: 'Konan',
  email,
  consentTraitement: true,
  consentContact: false,
  phone: '+2250700000000',
  entreprise: 'Boutique Aya',
  secteur: 'Commerce de détail',
  taille: '2 à 5',
}

await call('POST', '/api/public/sessions', {})

// Les deux diagnostics de la même session : la paire doit produire une lecture croisée.
const tokenDir = await run('dirigeant', 'BCBADBADDBCADA')
await run('rayonnement', 'CCCCCCC')

const key = `test-${suffixe}`
const r1 = await call('POST', '/api/public/leads', { participationToken: tokenDir, ...lead }, { 'Idempotency-Key': key })
check('POST /leads → 201', r1.status === 201, JSON.stringify(r1.data?.croisement ?? r1.data))
check('jeton de rapport émis', typeof r1.data?.reportToken === 'string' && r1.data.reportToken.length > 20)
check('lecture croisée calculée sur la paire', r1.data?.croisement?.code === 'CC',
  `code=${r1.data?.croisement?.code} · ${r1.data?.croisement?.qualificatif}`)

// Rejeu avec la même clé : pas de second rapport.
const r2 = await call('POST', '/api/public/leads', { participationToken: tokenDir, ...lead }, { 'Idempotency-Key': key })
check('rejeu idempotent accepté', r2.status === 201)
check('rejeu ne crée pas de croisement en double', r2.data?.croisement === null)

// Validations.
const bad1 = await call('POST', '/api/public/leads', { participationToken: tokenDir, ...lead, email: 'pas-un-email' })
check('email invalide rejeté', bad1.status === 400)
const bad2 = await call('POST', '/api/public/leads', { participationToken: tokenDir, ...lead, phone: '0700000000' })
check('téléphone hors format E.164 rejeté', bad2.status === 400,
  bad2.data?.data?.message?.slice(0, 60))
const bad3 = await call('POST', '/api/public/leads', { participationToken: tokenDir, ...lead, taille: 'Beaucoup' })
check('taille hors liste rejetée', bad3.status === 400)

// Parcours non terminé.
const ouvert = await call('POST', '/api/public/participations', { type: 'rayonnement' })
const pasFini = await call('POST', '/api/public/leads', { participationToken: ouvert.data.token, ...lead })
check('parcours non terminé refusé', pasFini.status === 422 &&
  pasFini.data?.data?.code === 'INCOMPLETE_PARTICIPATION')

// Conflit de rapprochement : email nouveau, téléphone déjà vu.
const r3 = await call('POST', '/api/public/leads', {
  participationToken: tokenDir, ...lead, email: `autre.${suffixe}@exemple.ci`,
}, { 'Idempotency-Key': `${key}-b` })
check('email inconnu + téléphone connu → accepté sans fusion', r3.status === 201)

console.log(fails ? `\n${fails} échec(s)` : '\nTous les contrôles passent.')
process.exit(fails ? 1 : 0)
