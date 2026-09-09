import { requireAdmin } from '../../../../utils/admin-auth'
import { publierVersion } from '../../../../utils/versions'

/** POST /api/admin/versions/:version/publier — T01 : publication ou réactivation, après contrôles. Rôle Administrateur. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'admin')
  const r = await publierVersion(event, getRouterParam(event, 'version')!)
  if (r.action === 'refusee') setResponseStatus(event, 422)
  return r
})
