import type { H3Event } from 'h3'
import { audit } from './admin-auth'
import { envoyerRapport } from './email'
import { reportByToken } from './report'
import { hashToken, newToken } from './tokens'

/** Libellé du modèle d'email selon les diagnostics du rapport (A07). */
export function libelleModele(types: string[] | null | undefined, template?: string): string {
  if (template === 'relance') return 'Relance à 7 jours'
  const t = new Set(types ?? [])
  if (t.has('dirigeant') && t.has('rayonnement')) return 'Rapport croisé complet'
  if (t.has('rayonnement')) return 'Rapport Rayonnement'
  return 'Rapport Dirigeant'
}

export const STATUT_NOTIFICATION: Record<string, { label: string; classe: string; icone: string }> = {
  queued: { label: 'En attente', classe: 'bg-amber-100 text-amber-600', icone: 'clock-outline' },
  generated: { label: 'En attente', classe: 'bg-amber-100 text-amber-600', icone: 'clock-outline' },
  accepted: { label: 'Accepté', classe: 'bg-navy-50 text-navy-600', icone: 'email-fast-outline' },
  delivered: { label: 'Remis', classe: 'bg-green-100 text-green-600', icone: 'check' },
  opened: { label: 'Ouvert', classe: 'bg-green-100 text-green-600', icone: 'email-check-outline' },
  bounced: { label: 'Échec', classe: 'bg-red-100 text-red-600', icone: 'alert-circle-outline' },
  failed: { label: 'Échec', classe: 'bg-red-100 text-red-600', icone: 'alert-circle-outline' },
  cancelled: { label: 'Annulé', classe: 'bg-gray-100 text-gray-500', icone: 'close' },
}

/** Ajoute une entrée horodatée au journal d'un envoi. */
export async function journalEnvoi(notificationId: string, type: string, detail?: string, at: Date = new Date()) {
  await db().query(
    `update notification set events = events || $2::jsonb, updated_at = now() where id = $1`,
    [notificationId, JSON.stringify([{ type, at: at.toISOString(), detail: detail ?? null }])],
  )
}

/**
 * Renvoi d'un rapport : mêmes snapshots, nouveau jeton (seul le hash est conservé, l'ancien
 * lien devient invalide). `nouvelEmail` corrige l'adresse du contact avant l'envoi
 * (« Corriger et renvoyer »), sous réserve d'unicité.
 */
export async function renvoyerRapport(event: H3Event, reportId: string, nouvelEmail?: string) {
  const { rows } = await db().query<{ id: string; status: string; contact_id: string }>(
    `select id, status, contact_id from report where id = $1`,
    [reportId],
  )
  const r = rows[0]
  if (!r) throw apiError(event, 'NOT_FOUND', 'Rapport introuvable.')
  if (r.status === 'revoked') throw apiError(event, 'NOT_FOUND', 'Le rapport a été révoqué.')
  if (nouvelEmail) {
    const email = nouvelEmail.trim().toLowerCase()
    const doublon = await db().query(`select 1 from contact where email_norm = $1 and id <> $2`, [email, r.contact_id])
    if (doublon.rowCount) throw apiError(event, 'VALIDATION_ERROR', 'Cette adresse appartient déjà à un autre contact.')
    await db().query(`update contact set email_norm = $1, updated_at = now() where id = $2`, [email, r.contact_id])
    await audit(event, 'contact.email', 'contact', r.contact_id, { email })
  }
  const token = newToken()
  await db().query(`update report set token_hash = $2, updated_at = now() where id = $1`, [r.id, hashToken(token)])
  const rapport = await reportByToken(event, token)
  const envoi = await envoyerRapport(rapport, token, r.id)
  await audit(event, 'report.resend', 'report', r.id, { to: envoi.to, sent: envoi.sent, error: envoi.error ?? null })
  return { reportId: r.id, email: envoi }
}
