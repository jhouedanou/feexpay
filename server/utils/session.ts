import type { H3Event } from 'h3'

export const SESSION_COOKIE = 'radar_sid'
/** Reprise 7 jours (CDC / PLAN.md §9 étape 9). */
export const SESSION_TTL_DAYS = 7

export type SessionRow = { id: string; expires_at: Date }

function setSessionCookie(event: H3Event, token: string) {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  })
}

/** Session courante si le cookie porte un jeton valide et non expiré, sinon null. */
export async function currentSession(event: H3Event): Promise<SessionRow | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null
  const { rows } = await db().query<SessionRow>(
    `update anonymous_session
        set last_seen_at = now(),
            expires_at   = now() + interval '${SESSION_TTL_DAYS} days'
      where token_hash = $1 and expires_at > now()
      returning id, expires_at`,
    [hashToken(token)]
  )
  // Glissante : chaque passage repousse l'échéance de 7 j.
  return rows[0] ?? null
}

/** Session courante, ou création + pose du cookie. Acquisition first-touch à la création. */
export async function ensureSession(
  event: H3Event,
  acquisition?: AcquisitionInput
): Promise<SessionRow> {
  const existing = await currentSession(event)
  if (existing) return existing

  const token = newToken()
  const session = await tx(async (c) => {
    const { rows } = await c.query<SessionRow>(
      `insert into anonymous_session (token_hash, expires_at)
       values ($1, now() + interval '${SESSION_TTL_DAYS} days')
       returning id, expires_at`,
      [hashToken(token)]
    )
    const row = rows[0]!
    // `acquisition.session_id` est unique : le first-touch ne peut pas être écrasé,
    // et la table est protégée par un trigger d'immutabilité.
    await c.query(
      `insert into acquisition
         (session_id, landing_url, referrer, utm_source, utm_medium, utm_campaign,
          utm_term, utm_content, fbclid, gclid, device)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        row.id,
        acquisition?.landingUrl ?? null,
        acquisition?.referrer ?? null,
        acquisition?.utmSource ?? null,
        acquisition?.utmMedium ?? null,
        acquisition?.utmCampaign ?? null,
        acquisition?.utmTerm ?? null,
        acquisition?.utmContent ?? null,
        acquisition?.fbclid ?? null,
        acquisition?.gclid ?? null,
        acquisition?.device ?? deviceFromUserAgent(getRequestHeader(event, 'user-agent')),
      ]
    )
    return row
  })

  setSessionCookie(event, token)
  return session
}

/** Session valide exigée, sinon SESSION_EXPIRED. */
export async function requireSession(event: H3Event): Promise<SessionRow> {
  const session = await currentSession(event)
  if (!session) throw apiError(event, 'SESSION_EXPIRED', 'Session absente ou expirée.')
  return session
}

export type AcquisitionInput = {
  landingUrl?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  fbclid?: string
  gclid?: string
  device?: string
}

function deviceFromUserAgent(ua?: string): string {
  if (!ua) return 'unknown'
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile'
  return 'desktop'
}
