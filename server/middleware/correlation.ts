import { randomUUID } from 'node:crypto'

export default defineEventHandler((event) => {
  const id = getHeader(event, 'x-correlation-id') ?? randomUUID()
  event.context.correlationId = id
  setHeader(event, 'x-correlation-id', id)
})
