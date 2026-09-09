import { requireAdmin } from '../../../../utils/admin-auth'
import { controlerVersion } from '../../../../utils/versions'

/** GET /api/admin/versions/:version/controler — T01 : contrôles automatiques sans effet. Rôle Analyste. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'analyste')
  return controlerVersion(getRouterParam(event, 'version')!)
})
