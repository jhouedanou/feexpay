import { createHmac, timingSafeEqual } from 'node:crypto'
import { journalEnvoi } from '../../../utils/rapports'

/**
 * POST /api/public/webhooks/resend — statuts de remise (A07). Signature Svix vérifiée avec
 * RESEND_WEBHOOK_SECRET (`whsec_…`) ; sans secret configuré, le webhook est refusé.
 * Événements : email.delivered → delivered, email.opened → opened, email.bounced → bounced,
 * email.complained → bounced, email.delivery_delayed → journal seul.
 */
const STATUTS: Record<string, string | null> = {
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.bounced': 'bounced',
  'email.complained': 'bounced',
  'email.delivery_delayed': null,
  'email.sent': null,
}
const ORDRE = ['queued', 'generated', 'accepted', 'delivered', 'opened']

export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig().resendWebhookSecret
  if (!secret) throw apiError(event, 'FORBIDDEN_SCOPE', 'Webhook non configuré.')
  const raw = (await readRawBody(event, 'utf8')) ?? ''
  const id = getHeader(event, 'svix-id') ?? ''
  const ts = getHeader(event, 'svix-timestamp') ?? ''
  const sigs = getHeader(event, 'svix-signature') ?? ''
  if (!id || !ts || !sigs) throw apiError(event, 'UNAUTHENTICATED', 'Signature absente.')
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) throw apiError(event, 'UNAUTHENTICATED', 'Horodatage hors tolérance.')
  const cle = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const attendu = createHmac('sha256', cle).update(`${id}.${ts}.${raw}`).digest()
  const valide = sigs.split(' ').some((s) => {
    const [, v] = s.split(',')
    if (!v) return false
    const b = Buffer.from(v, 'base64')
    return b.length === attendu.length && timingSafeEqual(b, attendu)
  })
  if (!valide) throw apiError(event, 'UNAUTHENTICATED', 'Signature invalide.')

  const payload = JSON.parse(raw) as { type: string; created_at?: string; data?: { email_id?: string; bounce?: { message?: string }; [k: string]: unknown } }
  const emailId = payload.data?.email_id
  if (!emailId || !(payload.type in STATUTS)) return { ok: true, ignored: true }
  const { rows } = await db().query<{ id: string; status: string }>(`select id, status from notification where provider_id = $1`, [emailId])
  const n = rows[0]
  if (!n) return { ok: true, ignored: true }
  const at = payload.created_at ? new Date(payload.created_at) : new Date()
  const detail = (payload.data?.bounce as { message?: string } | undefined)?.message ?? null
  await journalEnvoi(n.id, payload.type.replace('email.', ''), detail ?? undefined, at)
  const statut = STATUTS[payload.type]
  if (statut) {
    // Un statut ne régresse jamais (ouvert reste ouvert après une remise tardive) ; un rejet l'emporte.
    const avance = statut === 'bounced' || ORDRE.indexOf(statut) > ORDRE.indexOf(n.status)
    if (avance) {
      await db().query(`update notification set status = $2, last_error = $3, updated_at = now() where id = $1`, [n.id, statut, statut === 'bounced' ? (detail ?? 'adresse rejetée') : null])
    }
  }
  return { ok: true }
})
