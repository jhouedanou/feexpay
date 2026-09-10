import { z } from 'zod'
import { demanderReinitialisation } from '../../../utils/password-reset'

const Body = z.object({ email: z.string().trim().email() }).strict()

/**
 * POST /api/admin/auth/reset — demande de réinitialisation du mot de passe.
 *
 * La réponse est identique que l'adresse corresponde à un compte ou non : ce formulaire
 * est public, il ne doit pas permettre de découvrir qui dispose d'un accès. Le détail de
 * ce qui s'est réellement passé vit dans `audit_log`.
 */
export default defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Adresse email attendue.')

  await demanderReinitialisation(event, parsed.data.email.toLowerCase())

  return {
    ok: true,
    message: 'Si un compte correspond à cette adresse, un lien de réinitialisation vient d’être envoyé.',
    correlation_id: event.context.correlationId,
  }
})
