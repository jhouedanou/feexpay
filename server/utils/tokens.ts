import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** Jeton opaque remis au client : 32 octets base64url. */
export function newToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Seul le hash est stocké (CDC : jetons publics hashés en base). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function tokensEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}
