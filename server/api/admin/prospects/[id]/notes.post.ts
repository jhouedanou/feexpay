import { z } from 'zod'
import { audit, requireAdmin } from '../../../../utils/admin-auth'

/** POST /api/admin/prospects/:id/notes — A04 « Ajouter une note interne ». Rôle Commercial. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event, 'commercial')
  const id = getRouterParam(event, 'id')!
  const { texte } = z.object({ texte: z.string().trim().min(1).max(2000) }).parse(await readBody(event))
  const { rows } = await db().query<{ id: string }>(
    `insert into prospect_note (contact_id, author_id, texte) values ($1, $2, $3) returning id`,
    [id, admin.user.id, texte],
  )
  await audit(event, 'prospect.note', 'contact', id, { note: rows[0]!.id })
  return { id: rows[0]!.id }
})
