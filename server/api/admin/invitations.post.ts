import { z } from 'zod'
import { requireAdmin } from '../../utils/admin-auth'
import { creerInvitation } from '../../utils/invitations'

const Body = z.object({
  email: z.string().trim().toLowerCase().email().regex(/@(feexpay\.me|bigfiveabidjan\.com)$/i, 'Seuls les domaines feexpay.me et bigfiveabidjan.com sont acceptés.'),
  prenom: z.string().trim().min(1).max(120),
  nom: z.string().trim().min(1).max(120),
  role: z.enum(['lecture', 'commercial', 'analyste', 'admin']),
  team: z.string().trim().max(120).nullable().default(null),
  mfa_required: z.boolean().default(false),
  geo_restricted: z.boolean().default(false),
  export_allowed: z.boolean().default(false),
}).strict()

/** POST /api/admin/invitations — A09. Rôle Administrateur. */
export default defineEventHandler(async (event) => {
  const ctx = await requireAdmin(event, 'admin')
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Formulaire invalide.')
  const b = parsed.data
  const actif = await db().query(`select 1 from admin_user where email = $1 and status in ('active','suspended')`, [b.email])
  if (actif.rowCount) throw apiError(event, 'DUPLICATE_SUBMISSION', 'Un compte existe déjà pour cette adresse.')
  const r = await creerInvitation(event, { ...b, mfa_required: b.mfa_required || b.role === 'analyste' || b.role === 'admin' }, ctx.user.id)
  setResponseStatus(event, 201)
  return r
})
