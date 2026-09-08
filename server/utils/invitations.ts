import { Resend } from 'resend'
import type { H3Event } from 'h3'
import { supabaseAdmin } from './supabase'
import { ROLE_LABEL, type AdminRole, audit } from './admin-auth'

export const INVITATION_JOURS = 7

export interface InvitationInput {
  email: string
  prenom: string
  nom: string
  role: AdminRole
  team: string | null
  mfa_required: boolean
  geo_restricted: boolean
  export_allowed: boolean
}

/**
 * Crée (ou renvoie) une invitation : jeton maison de 7 jours, l'ancienne invitation en
 * attente pour cette adresse passe `revoked` (unique partiel `admin_invitation_pending_email`).
 * L'email part par Resend ; sans domaine vérifié il n'atteint que le titulaire du compte,
 * d'où le lien renvoyé à l'appelant pour transmission manuelle (A10, « Copier le lien »).
 */
export async function creerInvitation(event: H3Event, input: InvitationInput, inviterId: string) {
  const token = newToken()
  const row = await tx(async (c) => {
    await c.query(`update admin_invitation set status = 'revoked' where email = $1 and status = 'pending'`, [input.email])
    const { rows } = await c.query<{ id: string; expires_at: Date }>(
      `insert into admin_invitation (email, prenom, nom, role, team, mfa_required, geo_restricted, export_allowed,
                                     token_hash, inviter_id, expires_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now() + interval '${INVITATION_JOURS} days')
       returning id, expires_at`,
      [input.email, input.prenom, input.nom, input.role, input.team, input.mfa_required, input.geo_restricted, input.export_allowed, hashToken(token), inviterId],
    )
    return rows[0]!
  })
  const lien = `${useRuntimeConfig().public.appBaseUrl}/admin/invitation/${token}`
  const envoi = await envoyerInvitation(row.id, input, lien, inviterId)
  await audit(event, 'invitation.sent', 'admin_invitation', row.id, { email: input.email, role: input.role, sent: envoi.sent }, inviterId)
  return { id: row.id, lien, expires_at: row.expires_at, email: envoi }
}

async function envoyerInvitation(invitationId: string, input: InvitationInput, lien: string, inviterId: string) {
  const config = useRuntimeConfig()
  const notif = await db().query<{ id: string }>(
    `insert into notification (admin_invitation_id, template, recipient, status, attempts)
     values ($1, 'invitation-admin', $2, 'queued', 1) returning id`,
    [invitationId, input.email],
  )
  const nid = notif.rows[0]!.id
  const echec = async (m: string) => {
    await db().query(`update notification set status = 'failed', last_error = $2, updated_at = now() where id = $1`, [nid, m.slice(0, 500)])
    return { sent: false, error: m }
  }
  if (!config.resendApiKey) return echec('RESEND_API_KEY absente')
  const { rows } = await db().query<{ prenom: string; nom: string }>(`select prenom, nom from admin_user where id = $1`, [inviterId])
  const invitant = rows[0] ? `${rows[0].prenom} ${rows[0].nom}` : 'FeexPay'
  try {
    const r = await new Resend(config.resendApiKey).emails.send({
      from: config.resendFrom,
      to: input.email,
      subject: 'Votre accès à l’administration Radar by FeexPay',
      text: [
        `Bonjour ${input.prenom},`,
        '',
        `${invitant} vous ouvre un accès à l’administration Radar by FeexPay avec le rôle ${ROLE_LABEL[input.role]}.`,
        `Ce lien est à usage unique et expire dans ${INVITATION_JOURS} jours :`,
        lien,
        '',
        'Vous définirez votre mot de passe (12 caractères minimum) puis, selon votre rôle, votre double authentification.',
        'Si vous n’attendiez pas cet accès, ignorez ce message.',
      ].join('\n'),
    })
    if (r.error) return echec(`${r.error.name}: ${r.error.message}`)
    await db().query(`update notification set status = 'accepted', provider_id = $2, updated_at = now() where id = $1`, [nid, r.data?.id ?? null])
    return { sent: true }
  } catch (e) {
    return echec(e instanceof Error ? e.message : String(e))
  }
}

/** Invitation valable pour ce jeton, ou erreur explicite. */
export async function invitationParJeton(event: H3Event, token: string) {
  const { rows } = await db().query<{
    id: string; email: string; prenom: string | null; nom: string | null; role: AdminRole; team: string | null
    mfa_required: boolean; geo_restricted: boolean; export_allowed: boolean; inviter_id: string
    expires_at: Date; status: string
  }>(`select id, email::text, prenom, nom, role, team, mfa_required, geo_restricted, export_allowed, inviter_id, expires_at, status
        from admin_invitation where token_hash = $1`, [hashToken(token)])
  const inv = rows[0]
  if (!inv) throw apiError(event, 'NOT_FOUND', 'Invitation introuvable.')
  if (inv.status !== 'pending' || inv.expires_at < new Date()) {
    if (inv.status === 'pending') await db().query(`update admin_invitation set status = 'expired' where id = $1`, [inv.id])
    throw apiError(event, 'INVITATION_EXPIRED', 'Cette invitation a expiré ou a déjà été utilisée. Demandez-en une nouvelle.')
  }
  return inv
}

/**
 * Accepte l'invitation : compte Supabase créé (ou mot de passe posé s'il existe), ligne
 * `admin_user` active, invitation `accepted`. Le second facteur s'enrôle au premier login.
 */
export async function accepterInvitation(event: H3Event, token: string, prenom: string, nom: string, password: string) {
  const inv = await invitationParJeton(event, token)
  const sb = supabaseAdmin()
  let userId: string
  const existant = await db().query<{ id: string }>(`select id from admin_user where email = $1`, [inv.email])
  if (existant.rows[0]) {
    userId = existant.rows[0].id
    const r = await sb.auth.admin.updateUserById(userId, { password, email_confirm: true })
    if (r.error) throw apiError(event, 'VALIDATION_ERROR', r.error.message)
  } else {
    const r = await sb.auth.admin.createUser({
      email: inv.email, password, email_confirm: true,
      app_metadata: { role: inv.role, team: inv.team },
      user_metadata: { prenom, nom },
    })
    if (r.error || !r.data.user) throw apiError(event, 'VALIDATION_ERROR', r.error?.message ?? 'Création impossible.')
    userId = r.data.user.id
  }
  await tx(async (c) => {
    await c.query(
      `insert into admin_user (id, prenom, nom, email, role, team, status, mfa_required, geo_restricted, export_allowed, invited_by)
       values ($1,$2,$3,$4,$5,$6,'active',$7,$8,$9,$10)
       on conflict (id) do update set prenom = excluded.prenom, nom = excluded.nom, role = excluded.role, team = excluded.team,
         status = 'active', mfa_required = excluded.mfa_required, geo_restricted = excluded.geo_restricted,
         export_allowed = excluded.export_allowed, invited_by = excluded.invited_by`,
      [userId, prenom, nom, inv.email, inv.role, inv.team, inv.mfa_required, inv.geo_restricted, inv.export_allowed, inv.inviter_id],
    )
    await c.query(`update admin_invitation set status = 'accepted', accepted_at = now() where id = $1`, [inv.id])
  })
  await sb.auth.admin.updateUserById(userId, { app_metadata: { role: inv.role, team: inv.team } })
  await audit(event, 'invitation.accepted', 'admin_user', userId, { invitation: inv.id }, userId)
  return { userId, email: inv.email, role: inv.role }
}
