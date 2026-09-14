import { z } from 'zod'
import { requireAdmin } from '../../../../utils/admin-auth'
import { renvoyerRapport } from '../../../../utils/rapports'

/** POST /api/admin/rapports/:reportId/renvoyer — A07 « Renvoyer » et « Corriger et renvoyer » ({ email? }). Rôle Commercial. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'commercial')
  const id = getRouterParam(event, 'id')!
  const parse = z.object({ email: z.string().trim().email().max(254).optional() }).safeParse((await readBody(event).catch(() => null)) ?? {})
  if (!parse.success) throw apiError(event, 'VALIDATION_ERROR', 'Adresse email invalide.')
  const body = parse.data
  return renvoyerRapport(event, id, body.email)
})
