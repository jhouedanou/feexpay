import { and, eq, gt } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { schema, useDb } from './db'
import { TOKEN_RE, hashToken, newToken } from './tokens'

export const SESSION_COOKIE = 'radar_sid'
export const SESSION_DAYS = 7

export async function getAnonSession(event: H3Event) {
  const raw = getCookie(event, SESSION_COOKIE)
  if (!raw || !TOKEN_RE.test(raw)) return null
  const db = useDb()
  const [s] = await db
    .select()
    .from(schema.anonymousSession)
    .where(and(eq(schema.anonymousSession.tokenHash, hashToken(raw)), gt(schema.anonymousSession.expiresAt, new Date())))
    .limit(1)
  return s ?? null
}

export async function requireAnonSession(event: H3Event) {
  const s = await getAnonSession(event)
  if (!s) throw apiError(event, 'SESSION_EXPIRED')
  return s
}

export async function createAnonSession(event: H3Event) {
  const db = useDb()
  const token = newToken()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000)
  const [s] = await db.insert(schema.anonymousSession).values({ tokenHash: hashToken(token), expiresAt }).returning()
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    expires: expiresAt,
  })
  return s!
}
