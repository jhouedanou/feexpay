import { z } from 'zod'
import { audit, currentAdmin, setAdminCookie, verifierMotDePasse } from '../../../utils/admin-auth'
import { supabaseAdmin, supabaseAnon } from '../../../utils/supabase'

const Body = z.object({ actuel: z.string().min(1), nouveau: z.string().min(1) }).strict()

/**
 * POST /api/admin/auth/password — changement de mot de passe par un administrateur connecté.
 *
 * Le mot de passe actuel est exigé : une session ouverte ne suffit pas à en poser un nouveau,
 * sans quoi un poste laissé déverrouillé donnerait le compte. La politique CDC E.1 s'applique
 * au nouveau — douze caractères et absence des fuites connues.
 *
 * Changer le mot de passe invalide toutes les sessions du compte, y compris celle qui fait la
 * demande. On rouvre donc immédiatement celle-ci : l'appareil courant reste connecté, les
 * autres tombent. Le second facteur sera redemandé, la nouvelle session partant en `aal1`.
 */
export default defineEventHandler(async (event) => {
  const ctx = await currentAdmin(event)
  if (!ctx) throw apiError(event, 'UNAUTHENTICATED', 'Connexion requise.')

  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Mot de passe actuel et nouveau requis.')
  const { actuel, nouveau } = parsed.data

  if (actuel === nouveau) {
    throw apiError(event, 'VALIDATION_ERROR', 'Le nouveau mot de passe doit différer de l’actuel.')
  }

  // Contrôle du mot de passe actuel. Un échec ici est journalisé : c'est le signal d'une
  // tentative sur une session laissée ouverte.
  const verif = await supabaseAnon().auth.signInWithPassword({ email: ctx.user.email, password: actuel })
  if (verif.error || !verif.data.session) {
    await audit(event, 'password.change.failed', 'admin_user', ctx.user.id)
    throw apiError(event, 'UNAUTHENTICATED', 'Mot de passe actuel incorrect.')
  }

  const refus = await verifierMotDePasse(nouveau)
  if (refus) throw apiError(event, 'VALIDATION_ERROR', refus)

  const maj = await supabaseAdmin().auth.admin.updateUserById(ctx.user.id, { password: nouveau })
  if (maj.error) throw apiError(event, 'VALIDATION_ERROR', maj.error.message)

  const reconnexion = await supabaseAnon().auth.signInWithPassword({ email: ctx.user.email, password: nouveau })
  if (reconnexion.data.session) {
    setAdminCookie(event, {
      access: reconnexion.data.session.access_token,
      refresh: reconnexion.data.session.refresh_token,
    })
  }

  await audit(event, 'password.change.done', 'admin_user', ctx.user.id)

  return { ok: true, correlation_id: event.context.correlationId }
})
