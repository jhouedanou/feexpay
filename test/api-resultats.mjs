/**
 * Vérifie que le parcours HTTP complet produit les résultats normatifs du PLAN.md §5.5.
 * Le moteur est déjà testé unitairement ; ici on contrôle la chaîne
 * API -> base -> moteur -> snapshot -> projection publique. Exige `pnpm dev`.
 *
 *   nvm use 22 && pnpm test:results
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

/** Joue un diagnostic de bout en bout et renvoie le résultat public. */
async function run(type, letters) {
  const p = await call('POST', '/api/public/participations', { type })
  const token = p.data.token
  const prefix = type === 'dirigeant' ? 'Q' : 'R'
  for (let i = 0; i < letters.length; i++) {
    const qc = `${prefix}${i + 1}`
    const r = await call('PUT', `/api/public/participations/${token}/answers/${qc}`, {
      optionCode: qc + letters[i],
    })
    if (r.status !== 200) throw new Error(`PUT ${qc}: ${JSON.stringify(r.data)}`)
  }
  const done = await call('POST', `/api/public/participations/${token}/complete`)
  if (done.status !== 201) throw new Error(`complete: ${JSON.stringify(done.data)}`)
  return { token, ...done.data }
}

await call('POST', '/api/public/sessions', {})

// --- Cas de contrôle principal (PLAN.md §5.5) --------------------------------
const dir = await run('dirigeant', 'BCBADBADDBCADA')
check('Dirigeant BCBADBADDBCADA → Stratège', dir.result.archetype.code === 'Stratège',
  dir.result.archetype.code)
check('projection publique sans affinités, tie-break ni hypothèses',
  !JSON.stringify(dir.result).match(/affinit|tieBreak|hypothese/i))
check('niveau de pilotage exposé (maquette P08/P12)',
  typeof dir.result.pilotage?.lecture === 'string' && dir.result.pilotage.lecture.length > 0)
check('8 barres de dimensions', dir.result.dimensions.length === 8,
  dir.result.dimensions.map((d) => `${d.code}=${d.score}`).join(' '))

const ray = await run('rayonnement', 'CCCCCCC')
check('Rayonnement CCCCCCC → 67', ray.result.score === 67, `score=${ray.result.score}`)
check('niveau Challenger fort', ray.result.niveau.includes('Challenger'), ray.result.niveau)
check('météo présente', typeof ray.result.meteo === 'string' && ray.result.meteo.length > 0,
  ray.result.meteo)

// --- Cas limites A / D -------------------------------------------------------
const allA = await run('rayonnement', 'AAAAAAA')
check('Rayonnement AAAAAAA → 0', allA.result.score === 0, `score=${allA.result.score}`)
const allD = await run('rayonnement', 'DDDDDDD')
check('Rayonnement DDDDDDD → 100', allD.result.score === 100, `score=${allD.result.score}`)

// --- Idempotence et immutabilité --------------------------------------------
const again = await call('POST', `/api/public/participations/${ray.token}/complete`)
check('2e complete → 200 idempotent', again.status === 200 && again.data.alreadyCompleted === true)
check('même résultat au recalcul', again.data.result.score === ray.result.score)

const locked = await call('PUT', `/api/public/participations/${ray.token}/answers/R1`, {
  optionCode: 'R1A',
})
check('réponse après complete refusée', locked.status === 409 &&
  locked.data?.data?.code === 'DUPLICATE_SUBMISSION')

// --- Refus de calculer un parcours incomplet ---------------------------------
const partial = await call('POST', '/api/public/participations', { type: 'rayonnement' })
await call('PUT', `/api/public/participations/${partial.data.token}/answers/R1`, { optionCode: 'R1B' })
const tooSoon = await call('POST', `/api/public/participations/${partial.data.token}/complete`)
check('complete sur parcours incomplet refusé', tooSoon.status === 422 &&
  tooSoon.data?.data?.code === 'INCOMPLETE_PARTICIPATION')

// --- GET /results ------------------------------------------------------------
const got = await call('GET', `/api/public/results/${dir.token}`)
check('GET /results renvoie le résultat figé', got.status === 200 &&
  got.data.result.archetype.code === dir.result.archetype.code)
const notReady = await call('GET', `/api/public/results/${partial.data.token}`)
check('GET /results sur parcours ouvert refusé', notReady.status === 422)

console.log(fails ? `\n${fails} échec(s)` : '\nTous les contrôles passent.')
process.exit(fails ? 1 : 0)
