import { requireAdmin, ROLE_LABEL } from '../../utils/admin-auth'

/** GET /api/admin/users — A10 : comptes et invitations en attente. Rôle Administrateur. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'admin')
  const comptes = await db().query<Record<string, any>>(
    `select u.id, u.prenom, u.nom, u.email::text, u.role, u.team, u.status, u.mfa_enrolled_at, u.mfa_required,
            u.geo_restricted, u.export_allowed, u.last_login_at, u.created_at,
            i.prenom || ' ' || i.nom as invited_by_name
       from admin_user u left join admin_user i on i.id = u.invited_by
      order by u.status = 'active' desc, u.nom, u.prenom`,
  )
  const invitations = await db().query<Record<string, any>>(
    `select v.id, v.email::text, v.prenom, v.nom, v.role, v.team, v.mfa_required, v.geo_restricted, v.export_allowed,
            v.expires_at, v.created_at, v.status, i.prenom || ' ' || i.nom as inviter_name
       from admin_invitation v join admin_user i on i.id = v.inviter_id
      where v.status = 'pending' and v.expires_at > now()
        and not exists (select 1 from admin_user u where u.email = v.email and u.status <> 'invited')
      order by v.created_at desc`,
  )
  const dejaInvite = new Set(invitations.rows.map((r) => r.email))
  return {
    comptes: comptes.rows.filter((c) => !(c.status === 'invited' && dejaInvite.has(c.email))).map((c) => ({ ...c, roleLabel: ROLE_LABEL[c.role as keyof typeof ROLE_LABEL] })),
    invitations: invitations.rows.map((i) => ({ ...i, roleLabel: ROLE_LABEL[i.role as keyof typeof ROLE_LABEL] })),
  }
})
