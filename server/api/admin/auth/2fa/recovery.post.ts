import { z } from 'zod'
import { currentAdmin, audit, consommerCodeRecuperation } from '../../../../utils/admin-auth'
import { supabaseAdmin } from '../../../../utils/supabase'

const Body = z.object({ code: z.string().trim().min(8) }).strict()

/**
 * Code de récupération à usage unique : retire le facteur TOTP (à ré-enrôler à la
 * prochaine connexion) et marque l'événement. Le compte redescend en aal1 jusqu'à
 * un nouvel enrôlement, imposé par le middleware pour les rôles concernés.
 */
export default defineEventHandler(async (event) => {
  const ctx = await currentAdmin(event)
  if (!ctx) throw apiError(event, 'UNAUTHENTICATED', 'Connexion requise.')
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Code de récupération attendu.')
  const ok = await consommerCodeRecuperation(ctx.user.id, parsed.data.code)
  if (!ok) {
    await audit(event, 'mfa.recovery.failed', 'admin_user', ctx.user.id)
    throw apiError(event, 'UNAUTHENTICATED', 'Code de récupération invalide ou déjà utilisé.')
  }
  const factors = await supabaseAdmin().auth.admin.mfa.listFactors({ userId: ctx.user.id })
  for (const f of factors.data?.factors ?? []) {
    await supabaseAdmin().auth.admin.mfa.deleteFactor({ id: f.id, userId: ctx.user.id })
  }
  await db().query(`update admin_user set mfa_enrolled_at = null where id = $1`, [ctx.user.id])
  await audit(event, 'mfa.recovery.used', 'admin_user', ctx.user.id)
  return { ok: true, reenrolement: true }
})
