import { z } from 'zod'
import { requireAdmin, audit } from '../../../utils/admin-auth'
import { supabaseAdmin } from '../../../utils/supabase'

const Body = z.object({
  role: z.enum(['lecture', 'commercial', 'analyste', 'admin']).optional(),
  team: z.string().trim().max(120).nullable().optional(),
  status: z.enum(['active', 'suspended', 'revoked']).optional(),
  mfa_required: z.boolean().optional(),
  geo_restricted: z.boolean().optional(),
  export_allowed: z.boolean().optional(),
}).strict()

/**
 * PATCH /api/admin/users/{id} — A10 : rôle, équipe, réglages, suspension, réactivation,
 * révocation. Gardes CDC E.3 : pas d'auto-rétrogradation, dernier admin protégé (trigger
 * `guard_last_admin`), toute réduction de privilèges coupe les sessions Supabase.
 */
export default defineEventHandler(async (event) => {
  const ctx = await requireAdmin(event, 'admin')
  const id = getRouterParam(event, 'id')!
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Modification invalide.')
  const b = parsed.data
  const { rows } = await db().query<any>(`select id, role, status, email::text from admin_user where id = $1`, [id])
  const cible = rows[0]
  if (!cible) throw apiError(event, 'NOT_FOUND', 'Compte introuvable.')

  if (id === ctx.user.id && ((b.role && b.role !== 'admin') || (b.status && b.status !== 'active'))) {
    throw apiError(event, 'FORBIDDEN_SCOPE', 'Un administrateur ne peut pas retirer son propre rôle ni se suspendre.')
  }

  const sets: string[] = []
  const vals: unknown[] = []
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined) continue
    vals.push(v)
    sets.push(`${k} = $${vals.length}`)
  }
  if (!sets.length) return { ok: true }
  vals.push(id)
  try {
    await db().query(`update admin_user set ${sets.join(', ')} where id = $${vals.length}`, vals)
  } catch (e) {
    if (e instanceof Error && e.message.includes('LAST_ADMIN_GUARD')) {
      throw apiError(event, 'LAST_ADMIN_GUARD', 'Le dernier compte Administrateur actif ne peut pas être suspendu, révoqué ni rétrogradé.')
    }
    throw e
  }

  const privilegesReduits =
    (b.role && b.role !== cible.role) || (b.status && b.status !== 'active')
  if (privilegesReduits) {
    await supabaseAdmin().auth.admin.signOut(id, 'global').catch(() => null)
  }
  if (b.role) await supabaseAdmin().auth.admin.updateUserById(id, { app_metadata: { role: b.role } }).catch(() => null)
  if (b.status === 'revoked') await supabaseAdmin().auth.admin.updateUserById(id, { ban_duration: '876000h' }).catch(() => null)
  if (b.status === 'active' && cible.status !== 'active') await supabaseAdmin().auth.admin.updateUserById(id, { ban_duration: 'none' }).catch(() => null)

  await audit(event, 'user.updated', 'admin_user', id, b as Record<string, unknown>)
  return { ok: true }
})
