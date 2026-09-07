import { createHash, randomBytes } from 'node:crypto'

/** 32 bytes aléatoires → base64url. Jamais loggé, stocké hashé. */
export const newToken = () => randomBytes(32).toString('base64url')
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex')
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
