import { requireAdmin } from '../../utils/admin-auth'
import { identifiantParticipation } from '../../utils/admin-metier'

/** GET /api/admin/participations?q&type&status&page&taille — liste des participations (rail « Participations »). */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'lecture')
  const q = getQuery(event)
  const page = Math.max(1, Number.parseInt(String(q.page ?? '1'), 10) || 1)
  const taille = Math.min(100, Math.max(5, Number.parseInt(String(q.taille ?? '20'), 10) || 20))
  const params: unknown[] = []
  const where: string[] = []
  if (typeof q.type === 'string' && q.type) {
    params.push(q.type)
    where.push(`p.diagnostic_type = $${params.length}`)
  }
  if (typeof q.status === 'string' && q.status) {
    params.push(q.status)
    where.push(`p.status = $${params.length}`)
  }
  if (typeof q.q === 'string' && q.q.trim()) {
    params.push(`%${q.q.trim()}%`)
    where.push(`(c.prenom || ' ' || c.nom ilike $${params.length} or c.entreprise ilike $${params.length} or replace(p.id::text, '-', '') ilike $${params.length})`)
  }
  const w = where.length ? 'where ' + where.join(' and ') : ''
  const total = await db().query<{ n: string }>(`select count(*) as n from participation p left join contact c on c.id = p.contact_id ${w}`, params)
  params.push(taille, (page - 1) * taille)
  const { rows } = await db().query<Record<string, any>>(
    `select p.id, p.diagnostic_type, p.status, p.started_at, p.completed_at, p.duration_s, v.version,
            c.id as contact_id, c.prenom, c.nom, c.entreprise,
            s.result->'principal'->>'code' as profil, (s.result->>'scoreAffiche')::int as score, s.result->>'niveau' as niveau
       from participation p
       join scoring_version v on v.id = p.version_id
       left join contact c on c.id = p.contact_id
       left join score_snapshot s on s.participation_id = p.id
       ${w}
      order by p.started_at desc limit $${params.length - 1} offset $${params.length}`,
    params,
  )
  return {
    total: Number(total.rows[0]!.n),
    page,
    taille,
    items: rows.map((r) => ({ ...r, identifiant: identifiantParticipation(r.id, r.started_at) })),
  }
})
