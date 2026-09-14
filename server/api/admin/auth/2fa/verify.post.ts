import { z } from 'zod'
import { currentAdmin, audit, genererCodesRecuperation, setAdminCookie } from '../../../../utils/admin-auth'
import { supabaseAs } from '../../../../utils/supabase'

const Body = z.object({ code: z.string().trim().regex(/^\d{6}$/), factorId: z.string().optional() }).strict()

/**
 * Vérifie un code TOTP. Sans `factorId` : challenge du facteur vérifié existant (connexion).
 * Avec `factorId` : fin d'enrôlement, le compte passe en `mfa_enrolled_at` et reçoit ses
 * dix codes de récupération, remis une seule fois.
 */
export default defineEventHandler(async (event) => {
  const ctx = await currentAdmin(event)
  if (!ctx) throw apiError(event, 'UNAUTHENTICATED', 'Connexion requise.')
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Code à six chiffres attendu.')
  const sb = supabaseAs(ctx.accessToken)

  let factorId = parsed.data.factorId
  if (!factorId) {
    const f = await sb.auth.mfa.listFactors()
    factorId = f.data?.totp.find((x) => x.status === 'verified')?.id
    if (!factorId) throw apiError(event, 'VALIDATION_ERROR', 'Aucun second facteur enrôlé.')
  }
  const ch = await sb.auth.mfa.challenge({ factorId })
  if (ch.error || !ch.data) throw apiError(event, 'VALIDATION_ERROR', ch.error?.message ?? 'Challenge impossible.')
  const v = await sb.auth.mfa.verify({ factorId, challengeId: ch.data.id, code: parsed.data.code })
  if (v.error || !v.data) {
    await audit(event, 'mfa.verify.failed', 'admin_user', ctx.user.id)
    throw apiError(event, 'UNAUTHENTICATED', 'Code incorrect ou expiré.')
  }
  setAdminCookie(event, { access: v.data.access_token, refresh: v.data.refresh_token })

  let codes: string[] | null = null
  if (parsed.data.factorId) {
    await db().query(`update admin_user set mfa_enrolled_at = coalesce(mfa_enrolled_at, now()) where id = $1`, [ctx.user.id])
    codes = await genererCodesRecuperation(ctx.user.id)
    await audit(event, 'mfa.enroll.done', 'admin_user', ctx.user.id)
  } else {
    await audit(event, 'mfa.verify.success', 'admin_user', ctx.user.id)
  }
  return { ok: true, codesRecuperation: codes }
})
