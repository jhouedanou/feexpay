import { expedier, transportIndisponible } from './mailer'
import type { H3Event } from 'h3'

/**
 * Demandes de suppression de données (RGPD, article 17).
 *
 * Deux règles gouvernent ce module. La réponse à une demande est la même que l'adresse
 * corresponde à un contact ou non : ce formulaire est public, il ne doit pas permettre de
 * savoir qui figure dans la base. Et rien n'est enregistré tant que le lien reçu à l'adresse
 * visée n'a pas été ouvert — sans quoi n'importe qui déclencherait l'effacement d'un tiers.
 *
 * La suppression **anonymise** au lieu d'effacer en cascade : le journal d'audit et les
 * snapshots sont immuables par trigger, et les participations portent la mesure d'audience du
 * service. Ce qui disparaît, c'est ce qui désigne une personne.
 */

/** Le lien arrive par email : il n'a pas à survivre à la journée. */
export const SUPPRESSION_HEURES = 24

/** Adresse qui porte les demandes relatives aux données (politique de confidentialité §1). */
export const ADRESSE_DONNEES = 'donnees@feexpay.me'

/**
 * Ouvre une demande et envoie le lien de confirmation si l'adresse correspond à un contact.
 * Ne renvoie rien d'exploitable : le handler répond la même chose dans tous les cas.
 */
export async function demanderSuppression(event: H3Event, email: string) {
  const { rows } = await db().query<{ id: string; prenom: string }>(
    `select id, prenom from contact where email_norm = $1`,
    [email],
  )
  const contact = rows[0]

  if (!contact) {
    await audit(event, 'deletion.requested', 'contact', null, { connu: false }, null)
    return
  }

  const token = newToken()
  const demande = await tx(async (c) => {
    // Une nouvelle demande périme les précédentes : un seul lien valable à la fois.
    await c.query(
      `update deletion_request set status = 'expired'
        where email = $1 and status in ('pending', 'verified')`,
      [email],
    )
    const { rows: r } = await c.query<{ id: string }>(
      `insert into deletion_request (email, token_hash, expires_at, requested_ip)
       values ($1, $2, now() + interval '${SUPPRESSION_HEURES} hours', $3)
       returning id`,
      [email, hashToken(token), getRequestIP(event, { xForwardedFor: true }) ?? null],
    )
    return r[0]!
  })

  const lien = `${useRuntimeConfig().public.appBaseUrl}/supprimer-mes-donnees/${token}`
  await envoyerConfirmation(demande.id, email, contact.prenom, lien)
  await audit(event, 'deletion.requested', 'contact', contact.id, { connu: true }, null)
}

/** Demande valable pour ce jeton, ou erreur explicite. */
export async function demandeParJeton(event: H3Event, token: string) {
  const { rows } = await db().query<{
    id: string
    email: string
    status: string
    expires_at: Date
  }>(
    `select id, email::text, status, expires_at from deletion_request where token_hash = $1`,
    [hashToken(token)],
  )
  const d = rows[0]
  if (!d) throw apiError(event, 'NOT_FOUND', 'Demande introuvable.')
  if (d.status === 'done') throw apiError(event, 'DUPLICATE_SUBMISSION', 'Cette demande a déjà été traitée.')
  if (d.status !== 'pending' || d.expires_at < new Date()) {
    throw apiError(event, 'INVITATION_EXPIRED', 'Ce lien a expiré ou a déjà été utilisé. Faites une nouvelle demande.')
  }
  return d
}

/**
 * Confirme la demande. Elle entre alors dans la file de l'administration : la suppression
 * n'est pas automatique, une personne la prononce et en répond.
 */
export async function confirmerSuppression(event: H3Event, token: string) {
  const d = await demandeParJeton(event, token)
  const { rows } = await db().query<{ id: string }>(`select id from contact where email_norm = $1`, [d.email])
  await db().query(
    `update deletion_request set status = 'verified', verified_at = now(), contact_id = $2 where id = $1`,
    [d.id, rows[0]?.id ?? null],
  )
  await audit(event, 'deletion.verified', 'contact', rows[0]?.id ?? null, {}, null)
  return { email: d.email }
}

/**
 * Applique la suppression. Anonymise le contact, révoque ses rapports et efface ce qui le
 * désigne, sans toucher aux tables immuables.
 *
 * Ce qui reste, volontairement : les participations et leurs snapshots, désormais rattachés à
 * un contact sans identité, et le journal d'audit. Le premier sert la mesure du service, le
 * second est une obligation de traçabilité que le trigger d'immutabilité fait respecter.
 */
export async function appliquerSuppression(event: H3Event, demandeId: string, adminId: string) {
  const { rows } = await db().query<{ id: string; email: string; contact_id: string | null; status: string }>(
    `select id, email::text, contact_id, status from deletion_request where id = $1`,
    [demandeId],
  )
  const d = rows[0]
  if (!d) throw apiError(event, 'NOT_FOUND', 'Demande introuvable.')
  if (d.status !== 'verified') {
    throw apiError(event, 'VALIDATION_ERROR', 'Seule une demande confirmée par son auteur peut être traitée.')
  }

  const contactId =
    d.contact_id ?? (await db().query<{ id: string }>(`select id from contact where email_norm = $1`, [d.email])).rows[0]?.id ?? null

  const compte = await tx(async (c) => {
    if (!contactId) return { rapports: 0, notifications: 0, notes: 0 }

    // Les rapports deviennent inouvrables : le jeton ne mène plus à rien.
    // `revoked_at` accompagne obligatoirement le statut `revoked` (contrainte de la table).
    const rapports = await c.query(
      `update report
          set status = 'revoked', revoked_at = now(),
              token_hash = encode(gen_random_bytes(32), 'hex'), updated_at = now()
        where contact_id = $1 and status <> 'revoked'`,
      [contactId],
    )
    // Les envois gardent leur existence, pas leur destinataire.
    const notifications = await c.query(
      `update notification set recipient = 'supprime@invalide.local'
        where report_id in (select id from report where contact_id = $1)`,
      [contactId],
    )
    // Les notes internes portent des propos sur la personne.
    const notes = await c.query(`delete from prospect_note where contact_id = $1`, [contactId])
    await c.query(`delete from prospect_suivi where contact_id = $1`, [contactId])
    // Les cartes de partage portent son image.
    await c.query(
      `delete from share_asset where participation_id in (select id from participation where contact_id = $1)`,
      [contactId],
    )
    // Le contact perd tout ce qui le désigne. L'adresse est remplacée par une valeur unique :
    // la colonne est unique et ne peut pas être vidée.
    await c.query(
      `update contact
          set prenom = 'Supprimé', nom = 'Supprimé',
              email_norm = 'supprime+' || id || '@invalide.local',
              phone_e164 = null, entreprise = null, secteur = null, secteur_autre = null,
              taille = null, pays = null, match_conflict = null, updated_at = now()
        where id = $1`,
      [contactId],
    )
    return {
      rapports: rapports.rowCount ?? 0,
      notifications: notifications.rowCount ?? 0,
      notes: notes.rowCount ?? 0,
    }
  })

  await db().query(
    `update deletion_request set status = 'done', handled_at = now(), handled_by = $2 where id = $1`,
    [demandeId, adminId],
  )
  await audit(event, 'deletion.done', 'contact', contactId, compte)
  return compte
}

/** Rejet motivé : la demande sort de la file, le motif reste au journal. */
export async function rejeterSuppression(event: H3Event, demandeId: string, motif: string, adminId: string) {
  const { rowCount } = await db().query(
    `update deletion_request set status = 'rejected', handled_at = now(), handled_by = $2, motif = $3
      where id = $1 and status = 'verified'`,
    [demandeId, adminId, motif.slice(0, 500)],
  )
  if (!rowCount) throw apiError(event, 'VALIDATION_ERROR', 'Demande introuvable ou déjà traitée.')
  await audit(event, 'deletion.rejected', 'deletion_request', demandeId, { motif: motif.slice(0, 200) })
}

// --- Email -------------------------------------------------------------------

async function envoyerConfirmation(demandeId: string, email: string, prenom: string, lien: string) {
  const notif = await db().query<{ id: string }>(
    `insert into notification (deletion_request_id, template, recipient, status, attempts)
     values ($1, 'suppression-donnees', $2, 'queued', 1) returning id`,
    [demandeId, email],
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
      subject: 'Confirmez votre demande de suppression — Radar by FeexPay',
      text: [
        `Bonjour ${prenom},`,
        '',
        'Une demande de suppression de vos données a été faite depuis Radar by FeexPay.',
        `Confirmez-la en ouvrant ce lien, valable ${SUPPRESSION_HEURES} heures et à usage unique :`,
        lien,
        '',
        'Ce qui sera supprimé : votre nom, votre adresse email, votre téléphone, votre entreprise,',
        'ainsi que vos rapports, qui cesseront d’être consultables. Vos réponses sont conservées',
        'sans lien avec vous, à des fins de mesure du service.',
        '',
        'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : rien ne sera fait.',
        '',
        `Pour toute question : ${ADRESSE_DONNEES}`,
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
