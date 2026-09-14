import { requireAdmin } from '../../utils/admin-auth'

/** Familles d'actions proposées en filtre ; chaque famille couvre un préfixe d'`action`. */
export const FAMILLES_JOURNAL: Record<string, { label: string; prefixes: string[] }> = {
  acces: { label: 'Connexions', prefixes: ['login.', 'logout'] },
  mfa: { label: 'Second facteur', prefixes: ['mfa.'] },
  motdepasse: { label: 'Mots de passe', prefixes: ['password.'] },
  comptes: { label: 'Comptes et invitations', prefixes: ['user.', 'invitation.', 'seed.'] },
  donnees: { label: 'Exports et suppressions', prefixes: ['export.', 'deletion.', 'contact.'] },
  metier: { label: 'Prospects, rapports, réglages', prefixes: ['prospect.', 'report.', 'settings.', 'leviers.', 'email_template.', 'version.'] },
}

/**
 * GET /api/admin/journal?compte&famille&jours&page&taille — journal d'audit (A10 « Journal des
 * accès »). Rôle Administrateur. Lecture seule : la table refuse toute modification.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'admin')
  const q = getQuery(event)
  const s = (k: string) => (typeof q[k] === 'string' ? (q[k] as string) : '')
  const jours = Math.min(365, Math.max(0, Number(q.jours ?? 30) || 0))
  const page = Math.max(1, Number(q.page ?? 1) || 1)
  const taille = Math.min(100, Math.max(10, Number(q.taille ?? 50) || 50))

  const params: unknown[] = []
  const where: string[] = []
  if (jours) {
    params.push(jours)
    where.push(`a.ts >= now() - ($${params.length}::int * interval '1 day')`)
  }
  const compte = s('compte')
  if (compte) {
    params.push(compte)
    where.push(`(a.actor_id = $${params.length}::uuid or (a.target_type = 'admin_user' and a.target_id = $${params.length}))`)
  }
  const famille = FAMILLES_JOURNAL[s('famille')]
  if (famille) {
    params.push(famille.prefixes)
    where.push(`exists (select 1 from unnest($${params.length}::text[]) p where a.action like p || '%')`)
  }
  const clause = where.length ? `where ${where.join(' and ')}` : ''

  const total = await db().query<{ n: string }>(`select count(*) as n from audit_log a ${clause}`, params)
  const { rows } = await db().query(
    `select a.id, a.ts, a.action, a.target_type, a.target_id, a.payload_min, host(a.ip) as ip,
            u.prenom || ' ' || u.nom as acteur, u.email::text as acteur_email,
            case when a.target_type = 'admin_user' then (select prenom || ' ' || nom from admin_user where id::text = a.target_id) end as cible
       from audit_log a
       left join admin_user u on u.id = a.actor_id
       ${clause}
      order by a.ts desc
      limit $${params.length + 1} offset $${params.length + 2}`,
    [...params, taille, (page - 1) * taille],
  )
  const comptes = await db().query<{ id: string; nom: string }>(`select id, prenom || ' ' || nom as nom from admin_user where email not like 'test-%' order by prenom, nom`)

  return {
    lignes: rows,
    total: Number(total.rows[0]?.n ?? 0),
    page,
    taille,
    comptes: comptes.rows,
    familles: Object.entries(FAMILLES_JOURNAL).map(([cle, f]) => ({ cle, label: f.label })),
    correlation_id: event.context.correlationId,
  }
})
