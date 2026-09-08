import { currentAdmin, audit } from '../../../../utils/admin-auth'
import { supabaseAs } from '../../../../utils/supabase'

/** Démarre l'enrôlement TOTP : renvoie le secret et le QR (SVG) à afficher une seule fois. */
export default defineEventHandler(async (event) => {
  const ctx = await currentAdmin(event)
  if (!ctx) throw apiError(event, 'UNAUTHENTICATED', 'Connexion requise.')
  const sb = supabaseAs(ctx.accessToken)
  // Un facteur non vérifié laissé par une tentative précédente bloque un nouvel enrôlement : on le retire.
  const existants = await sb.auth.mfa.listFactors()
  for (const f of existants.data?.all ?? []) {
    if (f.status === 'unverified') await sb.auth.mfa.unenroll({ factorId: f.id })
  }
  const r = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Radar admin ${new Date().toISOString().slice(0, 10)}`, issuer: 'Radar by FeexPay' })
  if (r.error || !r.data) throw apiError(event, 'VALIDATION_ERROR', r.error?.message ?? 'Enrôlement impossible.')
  await audit(event, 'mfa.enroll.start', 'admin_user', ctx.user.id)
  return { factorId: r.data.id, secret: r.data.totp.secret, qr: r.data.totp.qr_code, uri: r.data.totp.uri }
})
