import { requireAdmin } from '../../utils/admin-auth'
import { libelleSource, numeroQuestion } from '../../utils/admin-metier'

/**
 * GET /api/admin/prospects — A03. Pagination et filtres côté serveur :
 *   q, page, taille, gravite=3, deux=1, profil, pilotage, rayonnement, theme, secteur, source.
 * Une ligne par contact, avec la dernière participation complète de chaque diagnostic.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'lecture')
  const q = getQuery(event)
  const s = (k: string) => (typeof q[k] === 'string' && (q[k] as string).trim() ? (q[k] as string).trim() : null)
  const page = Math.max(1, Number.parseInt(String(q.page ?? '1'), 10) || 1)
  const taille = Math.min(100, Math.max(5, Number.parseInt(String(q.taille ?? '20'), 10) || 20))

  const params: unknown[] = []
  const p = (v: unknown) => {
    params.push(v)
    return `$${params.length}`
  }
  const where: string[] = []
  if (s('q')) {
    const like = p(`%${s('q')}%`)
    where.push(`(c.prenom || ' ' || c.nom ilike ${like} or c.entreprise ilike ${like} or c.email_norm::text ilike ${like} or c.phone_e164 ilike ${like})`)
  }
  if (s('gravite')) where.push(`exists (select 1 from jsonb_array_elements(coalesce(dir.items->'difficulties', '[]'::jsonb) || coalesce(ray.items->'difficulties', '[]'::jsonb)) d where (d->>'gravite')::int >= ${p(Number(s('gravite')))})`)
  if (s('theme')) where.push(`exists (select 1 from jsonb_array_elements(coalesce(dir.items->'difficulties', '[]'::jsonb) || coalesce(ray.items->'difficulties', '[]'::jsonb)) d where d->>'dimension' = ${p(s('theme'))})`)
  if (s('deux')) where.push(`dir.contact_id is not null and ray.contact_id is not null`)
  if (s('profil')) where.push(`dir.result->'principal'->>'code' = ${p(s('profil'))}`)
  if (s('pilotage')) where.push(`dir.scores->'pilotage'->>'niveau' = ${p(s('pilotage'))}`)
  if (s('rayonnement')) where.push(`ray.result->>'niveau' = ${p(s('rayonnement'))}`)
  if (s('secteur')) where.push(`c.secteur = ${p(s('secteur'))}`)
  const source = s('source')

  const base = `
    with dir as (
      select distinct on (pa.contact_id) pa.contact_id, sc.result, sc.scores, ins.items
        from participation pa
        join score_snapshot sc on sc.participation_id = pa.id
        left join insight_snapshot ins on ins.participation_id = pa.id
       where pa.diagnostic_type = 'dirigeant' and pa.status = 'completed' and pa.contact_id is not null
       order by pa.contact_id, pa.completed_at desc),
    ray as (
      select distinct on (pa.contact_id) pa.contact_id, sc.result, sc.scores, ins.items
        from participation pa
        join score_snapshot sc on sc.participation_id = pa.id
        left join insight_snapshot ins on ins.participation_id = pa.id
       where pa.diagnostic_type = 'rayonnement' and pa.status = 'completed' and pa.contact_id is not null
       order by pa.contact_id, pa.completed_at desc),
    rap as (
      select distinct on (r.contact_id) r.contact_id, r.status as report_status, n.status as notif_status
        from report r left join notification n on n.report_id = r.id
       order by r.contact_id, r.created_at desc, n.created_at desc),
    src as (
      select distinct on (pa.contact_id) pa.contact_id, a.utm_source, a.utm_medium, a.referrer, a.fbclid, a.gclid
        from participation pa left join acquisition a on a.session_id = pa.session_id
       where pa.contact_id is not null
       order by pa.contact_id, pa.started_at)
    select c.id, c.prenom, c.nom, c.email_norm::text as email, c.phone_e164, c.entreprise, c.secteur, c.taille, c.pays, c.created_at,
           dir.result->'principal'->>'code' as profil,
           (dir.scores->'pilotage'->>'score')::float as pilotage,
           dir.scores->'pilotage'->>'niveau' as pilotage_niveau,
           (ray.result->>'scoreAffiche')::int as rayonnement,
           ray.result->>'niveau' as rayonnement_niveau,
           coalesce(dir.items->'difficulties', '[]'::jsonb) || coalesce(ray.items->'difficulties', '[]'::jsonb) as difficultes,
           (dir.contact_id is not null and ray.contact_id is not null) as deux,
           rap.report_status, rap.notif_status,
           src.utm_source, src.utm_medium, src.referrer, src.fbclid, src.gclid,
           (select count(*) from participation x where x.contact_id = c.id) as participations
      from contact c
      left join dir on dir.contact_id = c.id
      left join ray on ray.contact_id = c.id
      left join rap on rap.contact_id = c.id
      left join src on src.contact_id = c.id
     ${where.length ? 'where ' + where.join(' and ') : ''}
     order by c.created_at desc`

  const { rows } = await db().query<Record<string, any>>(base, params)
  // La source est un libellé dérivé de plusieurs colonnes : filtrée en mémoire.
  const filtres = source ? rows.filter((r) => libelleSource(r) === source) : rows
  const total = filtres.length
  const pageRows = filtres.slice((page - 1) * taille, page * taille)

  const totaux = await db().query<{ contacts: string; participations: string }>(
    `select (select count(*) from contact) as contacts,
            (select count(*) from participation where contact_id is not null) as participations`,
  )
  const secteurs = await db().query<{ secteur: string }>(`select distinct secteur from contact where secteur is not null order by 1`)
  const sources = [...new Set(rows.map((r) => libelleSource(r)))].sort()

  return {
    total,
    page,
    taille,
    contacts: Number(totaux.rows[0]!.contacts),
    participations: Number(totaux.rows[0]!.participations),
    secteurs: secteurs.rows.map((r) => r.secteur),
    sources,
    items: pageRows.map((r) => {
      const diffs = (r.difficultes as { gravite: number; difficulte: string; questionCode: string; dimension: string }[]).sort(
        (a, b) => b.gravite - a.gravite || numeroQuestion(a.questionCode) - numeroQuestion(b.questionCode),
      )
      const prioritaire = diffs[0] ?? null
      return {
        id: r.id,
        prenom: r.prenom,
        nom: r.nom,
        email: r.email,
        telephone: r.phone_e164,
        entreprise: r.entreprise,
        secteur: r.secteur,
        taille: r.taille,
        profil: r.profil,
        pilotage: r.pilotage === null ? null : Math.round(r.pilotage),
        pilotageNiveau: r.pilotage_niveau,
        rayonnement: r.rayonnement,
        rayonnementNiveau: r.rayonnement_niveau,
        deux: r.deux,
        difficulte: prioritaire ? { gravite: prioritaire.gravite, texte: prioritaire.difficulte, dimension: prioritaire.dimension } : null,
        rapport: statutRapport(r.report_status, r.notif_status),
        source: libelleSource(r),
        participations: Number(r.participations),
        creeLe: r.created_at,
      }
    }),
  }
})

/** Colonne « Rapport » : Envoyé / En attente / Échec / Aucun. */
export function statutRapport(report: string | null, notif: string | null): 'envoye' | 'attente' | 'echec' | 'aucun' {
  if (!report) return 'aucun'
  if (report === 'revoked') return 'echec'
  if (notif === 'failed' || notif === 'bounced') return 'echec'
  if (notif === 'accepted' || notif === 'delivered' || notif === 'opened') return 'envoye'
  return 'attente'
}
