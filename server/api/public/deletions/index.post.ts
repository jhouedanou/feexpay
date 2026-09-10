import { z } from 'zod'
import { demanderSuppression } from '../../../utils/deletion'

const Body = z.object({ email: z.string().trim().email() }).strict()

/**
 * POST /api/public/deletions — demande de suppression des données (RGPD article 17).
 *
 * La réponse est identique que l'adresse figure dans la base ou non : ce formulaire est
 * public, il ne doit pas permettre de découvrir qui a fait le diagnostic. Le détail vit dans
 * `audit_log`.
 */
export default defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Adresse email attendue.')

  await demanderSuppression(event, parsed.data.email.toLowerCase())

  return {
    ok: true,
    message: 'Si cette adresse figure dans nos données, un lien de confirmation vient d’être envoyé.',
    correlation_id: event.context.correlationId,
  }
})
