import { expedier, transportIndisponible } from './mailer'
import type { H3Event } from 'h3'
import { supabaseAdmin } from './supabase'
import { audit, verifierMotDePasse } from './admin-auth'

/**
 * Réinitialisation du mot de passe administrateur (PLAN.md §10.5, question ouverte n°5).
 *
 * Les codes de récupération ne couvrent que le second facteur : sans ce parcours, un
 * administrateur ayant perdu son mot de passe dépendait d'une intervention manuelle sur le
 * tableau de bord du fournisseur d'authentification.
 *
 * Deux règles gouvernent le module. La réponse à une demande est toujours la même, que
 * l'adresse existe ou non : le formulaire ne doit pas servir à découvrir qui a un compte.
 * Et le second facteur n'est jamais contourné — reposer le mot de passe ne désactive pas
 * la double authentification, qui reste exigée à la connexion suivante.
 */

/** Durée courte : le lien arrive par email, il n'a pas à survivre à la journée. */
export const RESET_MINUTES = 60

/**
 * Ouvre une demande et envoie le lien si le compte existe et peut se connecter. Ne
 * renvoie rien d'exploitable par l'appelant : le handler répond la même chose dans tous
 * les cas.
 */
export async function demanderReinitialisation(event: H3Event, email: string) {
  const { rows } = await db().query<{ id: string; prenom: string; status: string }>(
    `select id, prenom, status from admin_user where email = $1`,
    [email],
  )
  const compte = rows[0]

  // Un compte suspendu ou révoqué ne se réactive pas par ce chemin.
  if (!compte || compte.status !== 'active') {
    await audit(event, 'password.reset.requested', 'admin_user', compte?.id ?? null, { email, envoye: false }, null)
    return
  }

  const token = newToken()
  const reset = await tx(async (c) => {
    // Une nouvelle demande périme les précédentes : un seul lien valable à la fois.
    await c.query(
      `update admin_password_reset set used_at = now()
        where admin_user_id = $1 and used_at is null`,
      [compte.id],
    )
    const { rows: r } = await c.query<{ id: string }>(
      `insert into admin_password_reset (admin_user_id, token_hash, expires_at, requested_ip)
       values ($1, $2, now() + interval '${RESET_MINUTES} minutes', $3)
       returning id`,
      [compte.id, hashToken(token), getRequestIP(event, { xForwardedFor: true }) ?? null],
    )
    return r[0]!
  })

  const lien = `${useRuntimeConfig().public.appBaseUrl}/admin/mot-de-passe-oublie/${token}`
  await envoyerLienReset(reset.id, email, compte.prenom, lien)
  await audit(event, 'password.reset.requested', 'admin_user', compte.id, { envoye: true }, null)
}

/** Demande valable pour ce jeton, ou erreur explicite. */
export async function resetParJeton(event: H3Event, token: string) {
  const { rows } = await db().query<{
    id: string
    admin_user_id: string
    email: string
    prenom: string
    status: string
    expires_at: Date
    used_at: Date | null
  }>(
    `select p.id, p.admin_user_id, p.expires_at, p.used_at, u.email::text, u.prenom, u.status
       from admin_password_reset p join admin_user u on u.id = p.admin_user_id
      where p.token_hash = $1`,
    [hashToken(token)],
  )
  const reset = rows[0]
  if (!reset) throw apiError(event, 'NOT_FOUND', 'Lien de réinitialisation introuvable.')
  if (reset.used_at || reset.expires_at < new Date()) {
    throw apiError(event, 'INVITATION_EXPIRED', 'Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.')
  }
  if (reset.status !== 'active') throw apiError(event, 'FORBIDDEN_SCOPE', 'Ce compte est suspendu ou révoqué.')
  return reset
}

/**
 * Pose le nouveau mot de passe, ferme la demande et coupe les sessions ouvertes : si le
 * compte avait été pris, la session de l'intrus tombe avec.
 */
export async function appliquerReinitialisation(event: H3Event, token: string, password: string) {
  const reset = await resetParJeton(event, token)

  const refus = await verifierMotDePasse(password)
  if (refus) throw apiError(event, 'VALIDATION_ERROR', refus)

  const sb = supabaseAdmin()
  const r = await sb.auth.admin.updateUserById(reset.admin_user_id, { password, email_confirm: true })
  if (r.error) throw apiError(event, 'VALIDATION_ERROR', r.error.message)

  await db().query(`update admin_password_reset set used_at = now() where id = $1`, [reset.id])
  // Le verrouillage après cinq échecs n'a plus lieu d'être une fois le mot de passe repris.
  await db().query(
    `update admin_user set failed_logins = 0, locked_until = null where id = $1`,
    [reset.admin_user_id],
  )
  await sb.auth.admin.signOut(reset.admin_user_id, 'global').catch(() => null)

  await audit(event, 'password.reset.done', 'admin_user', reset.admin_user_id, {}, reset.admin_user_id)
  await envoyerAlerteSecurite(reset.email, reset.prenom)

  return { email: reset.email }
}

// --- Emails ------------------------------------------------------------------

async function envoyerLienReset(resetId: string, email: string, prenom: string, lien: string) {
  const notif = await db().query<{ id: string }>(
    `insert into notification (admin_password_reset_id, template, recipient, status, attempts)
     values ($1, 'reinitialisation-admin', $2, 'queued', 1) returning id`,
    [resetId, email],
  )
  const nid = notif.rows[0]!.id
  const echec = async (m: string) => {
    await db().query(
      `update notification set status = 'failed', last_error = $2, updated_at = now() where id = $1`,
      [nid, m.slice(0, 500)],
    )
  }
  const indisponible = transportIndisponible()
  if (indisponible) return echec(indisponible)

  try {
    const r = await expedier({
      to: email,
      subject: 'Votre accès à l’administration Radar by FeexPay',
      text: [
        `Bonjour ${prenom},`,
        '',
        'Vous avez demandé à choisir votre mot de passe pour l’administration Radar by FeexPay.',
        `Ce lien est à usage unique et expire dans ${RESET_MINUTES} minutes :`,
        lien,
        '',
        'Votre nouveau mot de passe devra compter au moins 12 caractères et ne pas figurer dans les fuites de données connues.',
        'Votre double authentification reste en place et vous sera demandée à la connexion.',
        '',
        'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable.',
      ].join('\n'),
    })
    if (r.error) return echec(r.error)
    await db().query(
      `update notification set status = 'accepted', provider_id = $2, updated_at = now() where id = $1`,
      [nid, r.id],
    )
  } catch (e) {
    await echec(e instanceof Error ? e.message : String(e))
  }
}

/**
 * Alerte de sécurité après changement effectif. Sans ligne `notification` : les trois
 * origines admises par la table sont un rapport, une invitation ou une demande de
 * réinitialisation, et la demande est close à ce stade. La trace vit dans `audit_log`.
 */
async function envoyerAlerteSecurite(email: string, prenom: string) {
  if (transportIndisponible()) return
  try {
    await expedier({
      to: email,
      subject: 'Votre mot de passe a été modifié — administration Radar by FeexPay',
      text: [
        `Bonjour ${prenom},`,
        '',
        'Le mot de passe de votre accès à l’administration Radar by FeexPay vient d’être modifié.',
        'Toutes vos sessions ouvertes ont été fermées : reconnectez-vous avec votre nouveau mot de passe.',
        '',
        'Si vous n’êtes pas à l’origine de ce changement, prévenez immédiatement l’administrateur du service.',
      ].join('\n'),
    })
  } catch (e) {
    // L'alerte est un complément : son échec ne remet pas en cause la réinitialisation.
    console.warn('[reset] alerte sécurité', e instanceof Error ? e.message : e)
  }
}
