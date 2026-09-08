/**
 * Toute route /api/admin/** exige un admin, sauf l'authentification elle-même et
 * l'acceptation d'invitation. Le rôle précis est vérifié dans chaque handler.
 */
import { currentAdmin } from '../utils/admin-auth'

const LIBRES = [/^\/api\/admin\/auth\//, /^\/api\/admin\/invitations\/(accept|preview)$/]

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/admin/')) return
  if (LIBRES.some((re) => re.test(path))) return
  const ctx = await currentAdmin(event)
  if (!ctx) throw apiError(event, 'UNAUTHENTICATED', 'Connexion requise.')
})
