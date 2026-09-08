import { randomUUID } from 'node:crypto'

/**
 * Un identifiant de corrélation par requête, propagé en en-tête et dans les erreurs.
 * Repris d'un en-tête entrant s'il existe (utile derrière un proxy / entre services).
 */
export default defineEventHandler((event) => {
  const incoming = getRequestHeader(event, 'x-correlation-id')
  const id = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID()
  event.context.correlationId = id
  setResponseHeader(event, 'x-correlation-id', id)
})
