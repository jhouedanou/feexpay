import { requireAdmin } from '../../utils/admin-auth'
import { ARCHETYPES, LECTURES_CROISEES, NIVEAUX_RAYONNEMENT, libelleSource } from '../../utils/admin-metier'

/**
 * GET /api/admin/dashboard?jours=18 — A02. Indicateurs sur la période et delta avec la
 * période précédente de même longueur. Rôle Lecture seule.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'lecture')
  const q = getQuery(event)
  const jours = Math.min(365, Math.max(1, Number.parseInt(String(q.jours ?? '18'), 10) || 18))
  const fin = new Date()
  const debut = new Date(fin.getTime() - jours * 86400_000)
  const debutPrec = new Date(debut.getTime() - jours * 86400_000)

  const kpi = async (d: Date, f: Date) => {
    const { rows } = await db().query<Record<string, string>>(
      `select
         (select count(*) from anonymous_session where created_at >= $1 and created_at < $2) as landing,
         (select count(distinct session_id) from participation where started_at >= $1 and started_at < $2) as participants,
         (select count(*) from participation where started_at >= $1 and started_at < $2) as commences,
         (select count(*) from participation where started_at >= $1 and started_at < $2 and status = 'completed') as termines,
         (select count(*) from participation where started_at >= $1 and started_at < $2 and status = 'completed' and contact_id is not null) as convertis,
         (select count(*) from contact where created_at >= $1 and created_at < $2) as contacts,
         (select count(*) from contact c where created_at >= $1 and created_at < $2
             and exists (select 1 from participation where contact_id = c.id and diagnostic_type = 'dirigeant' and status = 'completed')
             and exists (select 1 from participation where contact_id = c.id and diagnostic_type = 'rayonnement' and status = 'completed')) as deux`,
      [d, f],
    )
    const r = Object.fromEntries(Object.entries(rows[0]!).map(([k, v]) => [k, Number(v)])) as Record<'landing' | 'participants' | 'commences' | 'termines' | 'convertis' | 'contacts' | 'deux', number>
    const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
    return {
      ...r,
      completion: pct(r.termines, r.commences),
      conversion: pct(r.convertis, r.termines),
      deuxPct: pct(r.deux, r.contacts),
    }
  }
  const actuel = await kpi(debut, fin)
  const precedent = await kpi(debutPrec, debut)

  const archetypes = await db().query<{ code: string; n: string }>(
    `select s.result->'principal'->>'code' as code, count(*) as n
       from score_snapshot s join participation p on p.id = s.participation_id
      where p.diagnostic_type = 'dirigeant' and p.completed_at >= $1 and p.completed_at < $2
      group by 1`,
    [debut, fin],
  )
  const niveaux = await db().query<{ niveau: string; n: string }>(
    `select s.result->>'niveau' as niveau, count(*) as n
       from score_snapshot s join participation p on p.id = s.participation_id
      where p.diagnostic_type = 'rayonnement' and p.completed_at >= $1 and p.completed_at < $2
      group by 1`,
    [debut, fin],
  )
  const croisees = await db().query<{ code: string; n: string }>(
    `select code, count(*) as n from cross_reading where created_at >= $1 and created_at < $2 group by 1`,
    [debut, fin],
  )
  const sources = await db().query<{ utm_source: string | null; utm_medium: string | null; referrer: string | null; fbclid: string | null; gclid: string | null; demarrages: string; convertis: string }>(
    `select a.utm_source, a.utm_medium, a.referrer, a.fbclid, a.gclid,
            count(p.id) as demarrages,
            count(p.id) filter (where p.contact_id is not null) as convertis
       from participation p left join acquisition a on a.session_id = p.session_id
      where p.started_at >= $1 and p.started_at < $2
      group by 1, 2, 3, 4, 5`,
    [debut, fin],
  )
  const parSource = new Map<string, { demarrages: number; convertis: number }>()
  for (const s of sources.rows) {
    const k = libelleSource(s)
    const cur = parSource.get(k) ?? { demarrages: 0, convertis: 0 }
    cur.demarrages += Number(s.demarrages)
    cur.convertis += Number(s.convertis)
    parSource.set(k, cur)
  }
  const totalRay = niveaux.rows.reduce((a, r) => a + Number(r.n), 0)
  const totalCr = croisees.rows.reduce((a, r) => a + Number(r.n), 0)
  const pct = (n: number, t: number) => (t ? Math.round((n / t) * 100) : 0)

  return {
    periode: { jours, debut: debut.toISOString(), fin: fin.toISOString() },
    kpi: { actuel, precedent },
    entonnoir: [
      { label: 'Landing affichée', n: actuel.landing },
      { label: 'Diagnostic commencé', n: actuel.commences },
      { label: 'Diagnostic terminé', n: actuel.termines },
      { label: 'Prospect converti', n: actuel.contacts },
    ],
    archetypes: ARCHETYPES.map((code) => ({ code, n: Number(archetypes.rows.find((r) => r.code === code)?.n ?? 0) })).sort((a, b) => b.n - a.n),
    niveaux: NIVEAUX_RAYONNEMENT.map((niveau) => ({ niveau, pct: pct(Number(niveaux.rows.find((r) => r.niveau === niveau)?.n ?? 0), totalRay) })),
    croisees: Object.entries(LECTURES_CROISEES).map(([code, label]) => ({ code, label, pct: pct(Number(croisees.rows.find((r) => r.code === code)?.n ?? 0), totalCr) })),
    acquisition: [...parSource.entries()]
      .map(([source, v]) => ({ source, demarrages: v.demarrages, conversion: pct(v.convertis, v.demarrages) }))
      .sort((a, b) => b.demarrages - a.demarrages),
  }
})
