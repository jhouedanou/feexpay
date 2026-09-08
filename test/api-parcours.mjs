/**
 * Smoke test du parcours public (PLAN.md §9, Lot 1 étape 9) : session, participation,
 * réponses, reprise, abandon, cloisonnement. Exige un serveur lancé (`pnpm dev`).
 *
 *   nvm use 22 && pnpm dev      # dans un terminal
 *   nvm use 22 && pnpm test:api # dans un autre
 *
 * Écrit dans la base pointée par DATABASE_URL — ne pas exécuter sur la prod.
 */
const BASE = process.env.APP_BASE_URL ?? 'http://localhost:3000'
let cookie = ''
let fails = 0

async function call(method, path, body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const sc = r.headers.getSetCookie?.() ?? []
  for (const c of sc) if (c.startsWith('radar_sid=')) cookie = c.split(';')[0]
  let data
  try { data = await r.json() } catch { data = null }
  return { status: r.status, data, corr: r.headers.get('x-correlation-id') }
}

function check(label, cond, detail = '') {
  console.log(`${cond ? '✓' : '✗'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!cond) fails++
}

// 1. Session
const s1 = await call('POST', '/api/public/sessions', { landingUrl: 'http://localhost:3000/', utmSource: 'test' })
check('POST /sessions crée la session', s1.status === 200 && s1.data.resumed === false, `resumed=${s1.data?.resumed}`)
check('cookie radar_sid posé', cookie.startsWith('radar_sid='))
check('correlation_id présent', !!s1.corr)

const s2 = await call('POST', '/api/public/sessions', {})
check('POST /sessions reprend la session existante', s2.data?.resumed === true)

// 2. Participation
const p = await call('POST', '/api/public/participations', { type: 'dirigeant' })
check('POST /participations → 201', p.status === 201, `total=${p.data?.total}`)
check('total = 14 questions dirigeant', p.data?.total === 14)
check('version publiée = 2.1', p.data?.version === '2.1')
const token = p.data?.token

const pAgain = await call('POST', '/api/public/participations', { type: 'dirigeant' })
check('2e POST reprend au lieu de dupliquer', pAgain.status === 200 && pAgain.data?.resumed === true)
const token2 = pAgain.data?.token

// 3. État
const g = await call('GET', `/api/public/participations/${token2}`)
check('GET participation → 200', g.status === 200)
check('14 questions renvoyées', g.data?.questions?.length === 14)
check('4 options par question', g.data?.questions?.every((q) => q.options.length === 4))
check('currentIndex = 0 au départ', g.data?.currentIndex === 0)
const leak = JSON.stringify(g.data).match(/dim1|dim2|poids|gravite|hypothese|points/i)
check('AUCUNE fuite de barème vers le client', !leak, leak ? `fuite: ${leak[0]}` : 'mapping absent')

// 4. Réponses — cas de contrôle principal du PLAN §5.5
const CONTROL = 'BCBADBADDBCADA'
for (let i = 0; i < CONTROL.length; i++) {
  const qc = `Q${i + 1}`
  const r = await call('PUT', `/api/public/participations/${token2}/answers/${qc}`, { optionCode: qc + CONTROL[i] })
  if (r.status !== 200) { check(`PUT ${qc}`, false, JSON.stringify(r.data)); break }
  if (i === CONTROL.length - 1) check('14 réponses enregistrées', r.data.answered === 14 && r.data.complete === true)
}

// 5. Idempotence + révision
const again = await call('PUT', `/api/public/participations/${token2}/answers/Q1`, { optionCode: 'Q1B' })
check('PUT identique idempotent (toujours 14)', again.data?.answered === 14)
const revise = await call('PUT', `/api/public/participations/${token2}/answers/Q1`, { optionCode: 'Q1C' })
check('révision acceptée sans doublon', revise.data?.answered === 14)

// 6. Rejets
const bad1 = await call('PUT', `/api/public/participations/${token2}/answers/Q1`, { optionCode: 'Q2A' })
check('option d’une autre question rejetée', bad1.status === 422 && bad1.data?.data?.code === 'INVALID_ANSWER')
const bad2 = await call('PUT', `/api/public/participations/${token2}/answers/Q1`, { optionCode: 'Q1E' })
check('lettre inexistante rejetée', bad2.status === 400)
const bad3 = await call('PUT', `/api/public/participations/${token2}/answers/R1`, { optionCode: 'R1A' })
check('question du mauvais diagnostic rejetée', bad3.status === 422, `code=${bad3.data?.data?.code}`)

// 7. Cloisonnement par session
const saved = cookie
cookie = ''
const noSession = await call('GET', `/api/public/participations/${token2}`)
check('sans cookie → SESSION_EXPIRED 401', noSession.status === 401 && noSession.data?.data?.code === 'SESSION_EXPIRED')
await call('POST', '/api/public/sessions', {})
const otherSession = await call('GET', `/api/public/participations/${token2}`)
check('jeton d’une autre session → 404', otherSession.status === 404)
cookie = saved

// 8. Reprise après « reload »
const resume = await call('GET', `/api/public/participations/${token2}`)
check('reprise : 14 réponses relues', Object.keys(resume.data?.answers ?? {}).length === 14)
check('currentIndex = 14 (parcours complet)', resume.data?.currentIndex === 14)

// 9. Abandon puis relance
const ab = await call('POST', `/api/public/participations/${token2}/abandon`)
check('abandon → status abandoned', ab.data?.status === 'abandoned')
const relance = await call('PUT', `/api/public/participations/${token2}/answers/Q2`, { optionCode: 'Q2C' })
check('répondre relance la participation', relance.data?.status === 'in_progress')

// 10. Le premier jeton a été révoqué par la reprise
const old = await call('GET', `/api/public/participations/${token}`)
check('ancien jeton invalidé par la reprise', old.status === 404)

console.log(fails ? `\n${fails} échec(s)` : '\nTous les contrôles passent.')
process.exit(fails ? 1 : 0)
