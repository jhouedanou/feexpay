import { z } from 'zod'
import { adminUserById, setAdminCookie, mfaExigee, audit, aalDuJeton } from '../../../utils/admin-auth'
import { supabaseAnon } from '../../../utils/supabase'

const Body = z.object({ email: z.string().trim().email(), password: z.string().min(1) }).strict()
const MAX_TENTATIVES = 5
const VERROU_MIN = 15

/**
 * POST /api/admin/auth/login — A01. Mot de passe vérifié par Supabase, compte actif exigé,
 * verrouillage progressif après cinq échecs (CDC : « verrouillage progressif »), réponse
 * identique pour toute cause de refus.
 * Réponse : `mfa` indique si un second facteur est attendu avant d'entrer.
 */
export default defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Email et mot de passe requis.')
  const { email, password } = parsed.data

  const { rows } = await db().query<{ id: string; status: string; failed_logins: number; locked_until: Date | null }>(
    `select id, status, failed_logins, locked_until from admin_user where email = $1`,
    [email],
  )
  const compte = rows[0]
  // Même réponse quelle que soit la cause (adresse inconnue, mot de passe faux, compte
  // verrouillé) : le formulaire ne doit pas révéler quelles adresses ont un compte
  // (audit du 11 septembre 2026). Le verrouillage reste appliqué et journalisé.
  const REFUS = 'Email ou mot de passe incorrect.'
  if (compte?.locked_until && compte.locked_until > new Date()) {
    await audit(event, 'login.locked', 'admin_user', compte.id, {}, null)
    throw apiError(event, 'UNAUTHENTICATED', REFUS)
  }

  const r = await supabaseAnon().auth.signInWithPassword({ email, password })
  if (r.error || !r.data.session || !compte) {
    if (compte) {
      const restantes = Math.max(0, MAX_TENTATIVES - (compte.failed_logins + 1))
      await db().query(
        `update admin_user set failed_logins = failed_logins + 1,
                locked_until = case when failed_logins + 1 >= $2 then now() + interval '${VERROU_MIN} minutes' else null end
          where id = $1`,
        [compte.id, MAX_TENTATIVES],
      )
      await audit(event, 'login.failed', 'admin_user', compte.id, { restantes }, null)
    }
    throw apiError(event, 'UNAUTHENTICATED', REFUS)
  }
  if (compte.status !== 'active') {
    await audit(event, 'login.refused', 'admin_user', compte.id, { status: compte.status }, null)
    throw apiError(event, 'FORBIDDEN_SCOPE', 'Ce compte est suspendu ou révoqué. Contactez l’administrateur.')
  }

  const { session } = r.data
  setAdminCookie(event, { access: session.access_token, refresh: session.refresh_token })
  await db().query(`update admin_user set failed_logins = 0, locked_until = null, last_login_at = now() where id = $1`, [compte.id])
  const user = (await adminUserById(compte.id))!
  const aal = aalDuJeton(session.access_token)
  await audit(event, 'login.success', 'admin_user', user.id, {}, user.id)

  return {
    user: { id: user.id, prenom: user.prenom, nom: user.nom, role: user.role, team: user.team },
    mfa: {
      requise: mfaExigee(user),
      enrolee: Boolean(user.mfa_enrolled_at),
      verifiee: aal === 'aal2',
    },
  }
})
