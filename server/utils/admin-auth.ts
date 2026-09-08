import type { H3Event } from 'h3'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { supabaseAdmin, supabaseAnon, supabaseAs } from './supabase'

/**
 * Authentification et RBAC de l'admin (CDC partie E, PLAN.md Lot 4).
 *
 * Session : cookie httpOnly `radar_admin` portant les jetons Supabase (accès + refresh).
 * À chaque requête protégée, le jeton d'accès est vérifié auprès de Supabase, la ligne
 * `admin_user` est chargée (statut `active` exigé), et le niveau d'assurance `aal2` est
 * exigé pour les rôles Analyste et Administrateur, ou pour tout compte marqué
 * `mfa_required`. Les permissions sont vérifiées ici, côté API : les menus masqués
 * côté interface ne sont jamais une protection.
 */
export const ADMIN_COOKIE = 'radar_admin'
const ACCESS_TTL_S = 8 * 60 * 60

export type AdminRole = 'lecture' | 'commercial' | 'analyste' | 'admin'
export const ROLE_RANK: Record<AdminRole, number> = { lecture: 0, commercial: 1, analyste: 2, admin: 3 }
export const ROLE_LABEL: Record<AdminRole, string> = {
  lecture: 'Lecture seule',
  commercial: 'Commercial',
  analyste: 'Analyste',
  admin: 'Administrateur',
}

export interface AdminUser {
  id: string
  prenom: string
  nom: string
  email: string
  role: AdminRole
  team: string | null
  status: 'invited' | 'active' | 'suspended' | 'revoked'
  mfa_enrolled_at: Date | null
  mfa_required: boolean
  geo_restricted: boolean
  export_allowed: boolean
  last_login_at: Date | null
}

export interface AdminContext {
  user: AdminUser
  /** `aal1` : mot de passe seul ; `aal2` : second facteur vérifié. */
  aal: 'aal1' | 'aal2'
  accessToken: string
  /** Second facteur exigé pour ce compte (rôle ou réglage). */
  mfaRequise: boolean
}

type Tokens = { access: string; refresh: string }

export function setAdminCookie(event: H3Event, tokens: Tokens) {
  setCookie(event, ADMIN_COOKIE, Buffer.from(JSON.stringify(tokens)).toString('base64url'), {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: ACCESS_TTL_S,
  })
}

export function clearAdminCookie(event: H3Event) {
  deleteCookie(event, ADMIN_COOKIE, { path: '/' })
}

function readTokens(event: H3Event): Tokens | null {
  const raw = getCookie(event, ADMIN_COOKIE)
  if (!raw) return null
  try {
    const t = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
    return t?.access && t?.refresh ? t : null
  } catch {
    return null
  }
}

export async function adminUserById(id: string): Promise<AdminUser | null> {
  const { rows } = await db().query<AdminUser>(
    `select id, prenom, nom, email::text, role, team, status, mfa_enrolled_at, mfa_required,
            geo_restricted, export_allowed, last_login_at
       from admin_user where id = $1`,
    [id],
  )
  return rows[0] ?? null
}

/** Niveau d'assurance porté par le jeton Supabase (claim `aal`), sans session locale. */
export function aalDuJeton(access: string): 'aal1' | 'aal2' {
  try {
    const payload = JSON.parse(Buffer.from(access.split('.')[1] ?? '', 'base64url').toString('utf8'))
    return payload?.aal === 'aal2' ? 'aal2' : 'aal1'
  } catch {
    return 'aal1'
  }
}

export function mfaExigee(u: Pick<AdminUser, 'role' | 'mfa_required'>): boolean {
  return u.mfa_required || u.role === 'analyste' || u.role === 'admin'
}

/**
 * Contexte admin courant, ou null. Rafraîchit le jeton d'accès s'il est expiré.
 * Ne vérifie ni le statut ni le second facteur : voir `requireAdmin`.
 */
export async function currentAdmin(event: H3Event): Promise<AdminContext | null> {
  if (event.context.admin !== undefined) return event.context.admin as AdminContext | null
  const tokens = readTokens(event)
  if (!tokens) return (event.context.admin = null)

  let access = tokens.access
  let user = (await supabaseAs(access).auth.getUser()).data.user
  if (!user) {
    const r = await supabaseAnon().auth.refreshSession({ refresh_token: tokens.refresh })
    if (!r.data.session) {
      clearAdminCookie(event)
      return (event.context.admin = null)
    }
    access = r.data.session.access_token
    setAdminCookie(event, { access, refresh: r.data.session.refresh_token })
    user = r.data.user
  }
  if (!user) return (event.context.admin = null)

  const row = await adminUserById(user.id)
  if (!row) return (event.context.admin = null)
  const aal = aalDuJeton(access)
  const ctx: AdminContext = { user: row, aal, accessToken: access, mfaRequise: mfaExigee(row) }
  event.context.admin = ctx
  return ctx
}

/**
 * Exige un admin actif, le second facteur quand il s'impose, et un rôle minimal.
 * Refus par défaut : 401 sans session, 403 sans le rôle, 403 `MFA_REQUIRED` sans aal2.
 */
export async function requireAdmin(event: H3Event, role: AdminRole = 'lecture'): Promise<AdminContext> {
  const ctx = await currentAdmin(event)
  if (!ctx) throw apiError(event, 'UNAUTHENTICATED', 'Connexion requise.')
  if (ctx.user.status !== 'active') throw apiError(event, 'FORBIDDEN_SCOPE', 'Compte inactif.')
  if (ctx.mfaRequise && ctx.aal !== 'aal2') {
    throw apiError(event, 'MFA_REQUIRED', 'Double authentification requise.')
  }
  if (ROLE_RANK[ctx.user.role] < ROLE_RANK[role]) {
    throw apiError(event, 'FORBIDDEN_SCOPE', `Le rôle ${ROLE_LABEL[ctx.user.role]} ne donne pas accès à cette section.`)
  }
  return ctx
}

/** Journal d'audit, append-only (trigger `trg_audit_log_immutable`). */
export async function audit(
  event: H3Event,
  action: string,
  targetType: string,
  targetId: string | null,
  payload: Record<string, unknown> = {},
  actorId?: string | null,
) {
  const actor = actorId === undefined ? ((event.context.admin as AdminContext | null)?.user.id ?? null) : actorId
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? null
  await db().query(
    `insert into audit_log (actor_id, action, target_type, target_id, payload_min, ip)
     values ($1, $2, $3, $4, $5, $6)`,
    [actor, action, targetType, targetId, JSON.stringify(payload), ip],
  )
}

// --- Codes de récupération ---------------------------------------------------

/** Dix codes à usage unique, remis en clair une seule fois ; seul le hash est stocké. */
export async function genererCodesRecuperation(adminId: string): Promise<string[]> {
  const codes = Array.from({ length: 10 }, () =>
    randomBytes(5).toString('hex').replace(/(.{5})(.{5})/, '$1-$2'),
  )
  await db().query(`delete from admin_recovery_code where admin_user_id = $1 and used_at is null`, [adminId])
  for (const c of codes) {
    await db().query(`insert into admin_recovery_code (admin_user_id, code_hash) values ($1, $2)`, [
      adminId,
      hashCode(c),
    ])
  }
  return codes
}

export async function consommerCodeRecuperation(adminId: string, code: string): Promise<boolean> {
  const { rows } = await db().query<{ id: string; code_hash: string }>(
    `select id, code_hash from admin_recovery_code where admin_user_id = $1 and used_at is null`,
    [adminId],
  )
  const propre = code.trim().toLowerCase()
  for (const r of rows) {
    if (verifierCode(propre, r.code_hash)) {
      await db().query(`update admin_recovery_code set used_at = now() where id = $1`, [r.id])
      return true
    }
  }
  return false
}

function hashCode(code: string): string {
  const salt = randomBytes(16)
  const key = scryptSync(code.trim().toLowerCase(), salt, 32)
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`
}

function verifierCode(code: string, stored: string): boolean {
  const [, saltHex, keyHex] = stored.split('$')
  if (!saltHex || !keyHex) return false
  const key = scryptSync(code, Buffer.from(saltHex, 'hex'), 32)
  const ref = Buffer.from(keyHex, 'hex')
  return key.length === ref.length && timingSafeEqual(key, ref)
}

// --- Mot de passe : longueur et contrôle contre les fuites connues -------------

/** Politique CDC E.1 : 12 caractères et absence des bases de mots de passe compromis (HIBP, k-anonymat). */
export async function verifierMotDePasse(pwd: string): Promise<string | null> {
  if (pwd.length < 12) return 'Le mot de passe doit compter au moins 12 caractères.'
  try {
    const sha1 = createHash('sha1').update(pwd).digest('hex').toUpperCase()
    const r = await fetch(`https://api.pwnedpasswords.com/range/${sha1.slice(0, 5)}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(4000),
    })
    if (r.ok) {
      const suffixe = sha1.slice(5)
      const text = await r.text()
      const hit = text.split('\n').find((l) => l.startsWith(suffixe) && !l.trim().endsWith(':0'))
      if (hit) return 'Ce mot de passe figure dans des fuites de données connues. Choisissez-en un autre.'
    }
  } catch {
    // Service injoignable : la longueur reste vérifiée, on ne bloque pas l'invité.
  }
  return null
}

export { supabaseAdmin }
