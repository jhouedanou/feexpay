import { z } from 'zod'
import { setAdminCookie, verifierMotDePasse } from '../../../utils/admin-auth'
import { accepterInvitation, invitationParJeton } from '../../../utils/invitations'
import { supabaseAnon } from '../../../utils/supabase'

const Body = z.object({
  token: z.string().min(20),
  prenom: z.string().trim().min(1).max(120),
  nom: z.string().trim().min(1).max(120),
  password: z.string().min(12).max(200),
}).strict()

/** Acceptation d'une invitation (page publique /admin/invitation/{token}). Connecte l'invité. */
export default defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Prénom, nom et mot de passe de 12 caractères requis.')
  const { token, prenom, nom, password } = parsed.data
  await invitationParJeton(event, token)
  const faible = await verifierMotDePasse(password)
  if (faible) throw apiError(event, 'VALIDATION_ERROR', faible)
  const r = await accepterInvitation(event, token, prenom, nom, password)
  const s = await supabaseAnon().auth.signInWithPassword({ email: r.email, password })
  if (s.data.session) setAdminCookie(event, { access: s.data.session.access_token, refresh: s.data.session.refresh_token })
  return { ok: true, role: r.role }
})
