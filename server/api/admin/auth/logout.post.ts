import { clearAdminCookie, currentAdmin, audit } from '../../../utils/admin-auth'
import { supabaseAs } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const ctx = await currentAdmin(event)
  if (ctx) {
    await supabaseAs(ctx.accessToken).auth.signOut({ scope: 'local' }).catch(() => null)
    await audit(event, 'logout', 'admin_user', ctx.user.id)
  }
  clearAdminCookie(event)
  return { ok: true }
})
