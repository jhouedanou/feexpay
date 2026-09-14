import { requireAdmin } from '../../../../utils/admin-auth'
import { journaliserExport } from '../../../../utils/admin-metier'
import detail from '../[id].get'

/** GET /api/admin/participations/:id/export — A06 « Exporter les réponses » (JSON), journalisé. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event, 'commercial')
  if (!admin.user.export_allowed) throw apiError(event, 'FORBIDDEN_SCOPE', 'Export non autorisé pour ce compte.')
  const d = (await detail(event)) as Awaited<ReturnType<typeof detail>>
  await journaliserExport(event, { type: 'participation', id: d.id }, 'Export réponses', d.reponses.length)
  setHeader(event, 'content-type', 'application/json; charset=utf-8')
  setHeader(event, 'content-disposition', `attachment; filename="${d.identifiant}.json"`)
  return JSON.stringify(d, null, 2)
})
