import { z } from 'zod'
import { audit, requireAdmin } from '../../../../utils/admin-auth'
import { STATUTS_SUIVI } from '../../../../utils/admin-metier'

/** PATCH /api/admin/prospects/:id/suivi — A04 « Suivi commercial » : statut et responsable. Rôle Commercial. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event, 'commercial')
  const id = getRouterParam(event, 'id')!
  const body = z
    .object({
      statut: z.enum(Object.keys(STATUTS_SUIVI) as [string, ...string[]]).optional(),
      assigneeId: z.string().uuid().nullable().optional(),
    })
    .parse(await readBody(event))
  await db().query(
    `insert into prospect_suivi (contact_id, statut, assignee_id, updated_by, updated_at)
     values ($1, coalesce($2, 'a_contacter'), $3, $4, now())
     on conflict (contact_id) do update
       set statut = coalesce($2, prospect_suivi.statut),
           assignee_id = case when $5::boolean then $3 else prospect_suivi.assignee_id end,
           updated_by = $4, updated_at = now()`,
    [id, body.statut ?? null, body.assigneeId ?? null, admin.user.id, body.assigneeId !== undefined],
  )
  await audit(event, 'prospect.suivi', 'contact', id, body)
  return { ok: true }
})
