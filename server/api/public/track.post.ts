import { z } from 'zod'
import { envoyerGa4 } from '../../utils/ga4'
import { requireSession } from '../../utils/session'

/**
 * POST /api/public/track — point d'entrée serveur du plan de tracking (PLAN.md §6 et §8).
 *
 * Il ne double pas `gtag` : seuls y passent les événements que le plan désigne comme
 * « GA4 seul » et dont la mesure ne doit pas dépendre d'un bloqueur de scripts.
 * `question_answered` est le cas visé — c'est la mesure d'abandon en cours de parcours,
 * celle qui perd son sens si elle ne remonte que pour les navigateurs qui acceptent gtag.
 *
 * Rien de nominatif ne franchit cette route : ni réponse, ni valeur de formulaire, ni
 * jeton. Les paramètres admis sont énumérés, le reste est refusé par le schéma.
 */
const EVENEMENTS = ['question_answered'] as const

const Body = z
  .object({
    event: z.enum(EVENEMENTS),
    // Généré par le navigateur : porte l'idempotence dans `tracking_event_outbox`.
    eventId: z.string().uuid(),
    diagnostic: z.enum(['dirigeant', 'rayonnement']),
    questionCode: z.string().trim().max(20),
    numero: z.number().int().min(1).max(99),
  })
  .strict()

export default defineEventHandler(async (event) => {
  await requireSession(event)
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', 'Événement de mesure invalide.')
  const { event: nom, eventId, ...params } = parsed.data

  // Jamais bloquant : la mesure ne doit pas peser sur le parcours.
  await envoyerGa4(event, nom, eventId, params)

  setResponseStatus(event, 202)
  return { ok: true, correlation_id: event.context.correlationId }
})
