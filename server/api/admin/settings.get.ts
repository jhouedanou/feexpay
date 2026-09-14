import { requireAdmin } from '../../utils/admin-auth'

/** Réglages applicatifs (identifiants de tracking). Les valeurs secrètes sont masquées. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'admin')
  const { rows } = await db().query<{ key: string; value: string; secret: boolean; updated_at: Date; updated_by_name: string | null }>(
    `select s.key, s.value, s.secret, s.updated_at, u.prenom || ' ' || u.nom as updated_by_name
       from app_setting s left join admin_user u on u.id = s.updated_by order by s.key`,
  )
  return {
    settings: rows.map((r) => ({
      key: r.key,
      value: r.secret && r.value ? `${r.value.slice(0, 6)}…${r.value.slice(-4)}` : r.value,
      secret: r.secret,
      renseigne: r.value.length > 0,
      updated_at: r.updated_at,
      updated_by_name: r.updated_by_name,
    })),
  }
})
