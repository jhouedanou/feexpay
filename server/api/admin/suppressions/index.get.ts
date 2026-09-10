import { requireAdmin } from '../../../utils/admin-auth'

/**
 * GET /api/admin/suppressions — file des demandes de suppression.
 *
 * Les demandes non confirmées n'y figurent pas : tant que le lien n'a pas été ouvert, rien ne
 * prouve que la personne visée est bien à l'origine de la demande.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'admin')
  const { rows } = await db().query(
    `select d.id, d.email::text, d.status, d.created_at, d.verified_at, d.handled_at, d.motif,
            u.prenom || ' ' || u.nom as traite_par,
            c.id as contact_id,
            (select count(*)::int from report r where r.contact_id = c.id) as rapports,
            (select count(*)::int from participation p where p.contact_id = c.id) as participations
       from deletion_request d
       left join admin_user u on u.id = d.handled_by
       left join contact c on c.id = coalesce(d.contact_id, (select id from contact where email_norm = d.email))
      where d.status in ('verified', 'done', 'rejected')
      order by case when d.status = 'verified' then 0 else 1 end, d.created_at desc
      limit 200`,
  )
  return { demandes: rows }
})
