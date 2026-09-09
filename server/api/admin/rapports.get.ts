import { requireAdmin } from '../../utils/admin-auth'
import { libelleModele } from '../../utils/rapports'

/**
 * GET /api/admin/rapports?statut&modele&jours&page&taille — A07. Indicateurs sur la période
 * (comparés à la précédente), liste des envois, journal du dernier envoi. Rôle Commercial.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'commercial')
  const q = getQuery(event)
  const s = (k: string) => (typeof q[k] === 'string' && (q[k] as string).trim() ? (q[k] as string).trim() : null)
  const jours = Math.min(365, Math.max(1, Number.parseInt(String(q.jours ?? '7'), 10) || 7))
  const page = Math.max(1, Number.parseInt(String(q.page ?? '1'), 10) || 1)
  const taille = Math.min(100, Math.max(5, Number.parseInt(String(q.taille ?? '20'), 10) || 20))
  const fin = new Date()
  const debut = new Date(fin.getTime() - jours * 86400_000)
  const debutPrec = new Date(debut.getTime() - jours * 86400_000)

  const totaux = await db().query<Record<string, string>>(
    `select (select count(*) from report where status <> 'revoked') as generes,
            (select count(*) from notification where status in ('accepted', 'delivered', 'opened')) as envoyes,
            (select count(*) from notification where status in ('queued', 'generated')) as attente,
            (select count(distinct report_id) from notification n
              where n.status in ('failed', 'bounced')
                and n.created_at = (select max(created_at) from notification x where x.report_id = n.report_id)) as echecs,
            (select count(distinct report_id) from notification n
              where n.status = 'bounced'
                and n.created_at = (select max(created_at) from notification x where x.report_id = n.report_id)) as invalides`,
  )
  const kpi = async (d: Date, f: Date) => {
    const { rows } = await db().query<Record<string, string>>(
      `select count(*) filter (where status in ('accepted', 'delivered', 'opened', 'failed', 'bounced')) as tentes,
              count(*) filter (where status in ('accepted', 'delivered', 'opened')) as remis,
              count(*) filter (where status = 'opened') as ouverts,
              (select count(*) from report r where r.created_at >= $1 and r.created_at < $2 and r.status <> 'revoked') as rapports,
              (select count(*) from report r where r.created_at >= $1 and r.created_at < $2 and r.opened_at is not null) as ouverts_ligne
         from notification where created_at >= $1 and created_at < $2 and report_id is not null`,
      [d, f],
    )
    const r = Object.fromEntries(Object.entries(rows[0]!).map(([k, v]) => [k, Number(v)])) as Record<'tentes' | 'remis' | 'ouverts' | 'rapports' | 'ouverts_ligne', number>
    const pct1 = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0)
    return { remise: pct1(r.remis, r.tentes), ouverture: Math.round(pct1(r.ouverts, r.remis)), enLigne: Math.round(pct1(r.ouverts_ligne, r.rapports)), ...r }
  }

  const params: unknown[] = []
  const where: string[] = ['n.report_id is not null']
  const statut = s('statut')
  if (statut === 'echec') where.push(`n.status in ('failed', 'bounced')`)
  else if (statut === 'attente') where.push(`n.status in ('queued', 'generated')`)
  else if (statut === 'remis') where.push(`n.status in ('accepted', 'delivered')`)
  else if (statut === 'ouvert') where.push(`n.status = 'opened'`)
  if (jours) {
    params.push(debut)
    where.push(`n.created_at >= $${params.length}`)
  }
  const { rows } = await db().query<Record<string, any>>(
    `select n.id, n.report_id, n.recipient::text, n.status, n.attempts, n.last_error, n.created_at, n.updated_at, n.events,
            r.opened_at, r.status as report_status, r.editorial_version,
            c.id as contact_id, c.prenom, c.nom,
            (select array_agg(p.diagnostic_type::text) from score_snapshot sc join participation p on p.id = sc.participation_id
              where sc.id = any (array(select jsonb_array_elements_text(r.snapshot_refs->'score_snapshot_ids'))::uuid[])) as types,
            (select v.version from score_snapshot sc join participation p on p.id = sc.participation_id join scoring_version v on v.id = p.version_id
              where sc.id = any (array(select jsonb_array_elements_text(r.snapshot_refs->'score_snapshot_ids'))::uuid[]) limit 1) as version
       from notification n
       join report r on r.id = n.report_id
       join contact c on c.id = r.contact_id
      where ${where.join(' and ')}
      order by n.created_at desc`,
    params,
  )
  const modele = s('modele')
  const lignes = rows
    .map((r) => ({
      id: r.id,
      reportId: r.report_id,
      contact: { id: r.contact_id, prenom: r.prenom, nom: r.nom },
      destinataire: r.recipient,
      modele: libelleModele(r.types),
      version: r.version,
      envoyeLe: r.created_at,
      majLe: r.updated_at,
      statut: r.status,
      tentatives: r.attempts,
      erreur: r.last_error,
      events: r.events ?? [],
      ouvertEnLigne: r.opened_at,
      reportStatus: r.report_status,
    }))
    .filter((l) => !modele || l.modele === modele)

  return {
    periode: { jours, debut: debut.toISOString(), fin: fin.toISOString() },
    totaux: Object.fromEntries(Object.entries(totaux.rows[0]!).map(([k, v]) => [k, Number(v)])),
    kpi: { actuel: await kpi(debut, fin), precedent: await kpi(debutPrec, debut) },
    total: lignes.length,
    page,
    taille,
    items: lignes.slice((page - 1) * taille, page * taille),
    dernier: lignes[0] ?? null,
    modeles: ['Rapport Dirigeant', 'Rapport Rayonnement', 'Rapport croisé complet'],
  }
})
