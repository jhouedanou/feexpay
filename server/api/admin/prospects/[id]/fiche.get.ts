import { requireAdmin } from '../../../../utils/admin-auth'
import { journaliserExport } from '../../../../utils/admin-metier'
import { fichePdf } from '../../../../utils/pdf'
import fiche from './index.get'

/** GET /api/admin/prospects/:id/fiche?vue=synthese|entretien — A04 « Exporter la fiche », A05 « Exporter la fiche entretien ». */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event, 'commercial')
  if (!admin.user.export_allowed) throw apiError(event, 'FORBIDDEN_SCOPE', 'Export non autorisé pour ce compte.')
  const id = getRouterParam(event, 'id')!
  const vue = getQuery(event).vue === 'entretien' ? 'entretien' : 'synthese'
  const d = (await fiche(event)) as Awaited<ReturnType<typeof fiche>>
  const pdf = fichePdf(d as any, vue)
  await journaliserExport(event, { type: `fiche-${vue}`, contact: id }, `Export fiche ${vue}`, 1)
  setHeader(event, 'content-type', 'application/pdf')
  setHeader(event, 'content-disposition', `attachment; filename="radar-fiche-${vue}-${d.contact.nom.toLowerCase()}.pdf"`)
  return pdf
})
