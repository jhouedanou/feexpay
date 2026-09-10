import { z } from 'zod'
import { appliquerReinitialisation } from '../../../../utils/password-reset'

const Body = z.object({ token: z.string().trim().min(20), password: z.string().min(1) }).strict()

/**
 * POST /api/admin/auth/reset/confirm — pose le nouveau mot de passe.
 *
 * La politique CDC E.1 (12 caractères, absence des fuites connues) est appliquée par
 * `verifierMotDePasse`, comme à l'acceptation d'une invitation. Le second facteur reste
 * en place : il sera demandé à la connexion suivante.
 */
export default defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Lien et mot de passe requis.')

  const { email } = await appliquerReinitialisation(event, parsed.data.token, parsed.data.password)

  return { ok: true, email, correlation_id: event.context.correlationId }
})
