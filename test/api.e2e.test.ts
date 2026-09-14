import { fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

await setup({ server: true, browser: false, env: { DATABASE_URL: process.env.DATABASE_URL!, NUXT_DATABASE_URL: process.env.DATABASE_URL! } })

let cookie = ''
async function api(url: string, opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: { cookie, 'content-type': 'application/json', ...(opts.headers ?? {}) },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })
  const text = await res.text()
  let data: any = null
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { status: res.status, headers: res.headers, data }
}

describe('parcours public', () => {
  let token = ''
  it('session : cookie posé, acquisition first-touch', async () => {
    const r = await api('/api/public/sessions', { method: 'POST', body: { landing_url: 'http://x/?utm_source=fb', utm_source: 'fb' } })
    expect(r.status).toBe(200)
    cookie = (r.headers.get('set-cookie') ?? '').split(';')[0]!
    expect(cookie).toMatch(/^radar_sid=/)
    const r2 = await api('/api/public/sessions', { method: 'POST', body: {} })
    expect(r2.data.resumed).toBe(true)
  })
  it('participation dirigeant créée', async () => {
    const r = await api('/api/public/participations', { method: 'POST', body: { type: 'dirigeant' } })
    expect(r.status).toBe(200)
    token = r.data.token
    expect(token).toHaveLength(43)
    expect(r.data.version).toBe('2.1')
  })
  it('complete avant réponses → INCOMPLETE_PARTICIPATION', async () => {
    const r = await api(`/api/public/participations/${token}/complete`, { method: 'POST' })
    expect(r.status).toBe(409)
    expect(r.data.data.code).toBe('INCOMPLETE_PARTICIPATION')
  })
  it('réponse invalide refusée', async () => {
    const r = await api(`/api/public/participations/${token}/answers/Q1`, { method: 'PUT', body: { optionCode: 'Q2A' } })
    expect(r.status).toBe(400)
  })
  it('14 réponses (cas simulateur), révision idempotente', async () => {
    const seq = 'BCBADBADDBCADA'
    for (let i = 0; i < 14; i++) {
      const r = await api(`/api/public/participations/${token}/answers/Q${i + 1}`, { method: 'PUT', body: { optionCode: `Q${i + 1}${seq[i]}` } })
      expect(r.status).toBe(200)
    }
    const r = await api(`/api/public/participations/${token}/answers/Q1`, { method: 'PUT', body: { optionCode: 'Q1B' } })
    expect(r.status).toBe(200)
    const st = await api(`/api/public/participations/${token}`)
    expect(st.data.current_index).toBe(14)
    expect(st.data.answers.Q1).toBe('B')
  })
  it('complete → Stratège, sans pilotage ; idempotent', async () => {
    const r = await api(`/api/public/participations/${token}/complete`, { method: 'POST' })
    expect(r.status).toBe(200)
    expect(r.data.result.principal.code).toBe('Stratège')
    expect(JSON.stringify(r.data)).not.toMatch(/pilotage|affinit/)
    const r2 = await api(`/api/public/participations/${token}/complete`, { method: 'POST' })
    expect(r2.data.idempotent).toBe(true)
    const res = await api(`/api/public/results/${token}`)
    expect(res.data.principal.code).toBe('Stratège')
  })
  it('dimensions dirigeant servies libellées et ordonnées', async () => {
    const res = await api(`/api/public/results/${token}`)
    expect(res.data.dims).toHaveLength(8)
    // Valeurs du cas de contrôle §5.5 (BCBADBADDBCADA) : une régression de clés
    // qui remettrait tout à zéro serait invisible avec expect.any(Number).
    expect(res.data.dims[0]).toEqual({ code: 'VIS', nom: 'Vision', valeur: 33 })
    expect(res.data.dims[1]).toEqual({ code: 'STR', nom: 'Stratégie', valeur: 87 })
    expect(res.data.dims.map((d: { valeur: number }) => d.valeur)).toEqual([33, 87, 6, 17, 24, 33, 50, 24])
    expect(res.data.dims.every((d: { nom: string }) => d.nom !== '')).toBe(true)
    expect(res.data.norm).toBeUndefined()
  })
  it('réponse après complétion refusée', async () => {
    const r = await api(`/api/public/participations/${token}/answers/Q1`, { method: 'PUT', body: { optionCode: 'Q1A' } })
    expect(r.status).toBe(409)
  })
  it('rayonnement CCCCCCC → 67 Challenger fort Éclaircies', async () => {
    const p = await api('/api/public/participations', { method: 'POST', body: { type: 'rayonnement' } })
    const t = p.data.token
    for (let i = 1; i <= 7; i++) await api(`/api/public/participations/${t}/answers/R${i}`, { method: 'PUT', body: { optionCode: `R${i}C` } })
    const r = await api(`/api/public/participations/${t}/complete`, { method: 'POST' })
    expect(r.data.result.score).toBe(67)
    expect(r.data.result.niveau).toBe('Challenger fort')
    expect(r.data.result.meteo).toBe('Éclaircies')
    expect(r.data.result.differenciation).toBe('Qualité')
    expect(r.data.result.meteoCode).toBe('eclaircies')
    expect(r.data.result.dims).toHaveLength(5)
    expect(r.data.result.dims[1]).toEqual({ code: 'lectureConcurrentielle', nom: 'Lecture concurrentielle', valeur: 67 })
  })
  it('jeton inconnu → 404 ; sans cookie → SESSION_EXPIRED', async () => {
    expect((await api(`/api/public/results/${'x'.repeat(43)}`)).status).toBe(404)
    expect((await api('/api/public/participations', { method: 'POST', body: { type: 'dirigeant' }, headers: { cookie: '' } })).status).toBe(401)
  })
})
