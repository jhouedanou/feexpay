import { requireAdmin } from '../../utils/admin-auth'
import { registreVersions } from '../../utils/versions'

/** GET /api/admin/versions — T01 : registre des versions (code et base). Rôle Analyste. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'analyste')
  const journal = await db().query<Record<string, any>>(
    `select l.action, l.target_id as version, l.payload_min, l.ts, a.prenom || ' ' || a.nom as acteur
       from audit_log l left join admin_user a on a.id = l.actor_id
      where l.target_type = 'scoring_version' order by l.ts desc limit 20`,
  )
  return { versions: await registreVersions(), journal: journal.rows }
})
