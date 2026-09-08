import { audit, requireAdmin } from '../../../../utils/admin-auth'
import { envoyerRapport } from '../../../../utils/email'
import { reportByToken } from '../../../../utils/report'
import { hashToken, newToken } from '../../../../utils/tokens'

/**
 * POST /api/admin/prospects/:id/rapport — A04 « Renvoyer le rapport ». Le même rapport (mêmes
 * snapshots) repart avec un nouveau jeton : seul le hash est conservé, l'ancien lien devient
 * invalide. Rôle Commercial, journalisé.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'commercial')
  const id = getRouterParam(event, 'id')!
  const { rows } = await db().query<{ id: string; status: string }>(
    `select id, status from report where contact_id = $1 order by created_at desc limit 1`,
    [id],
  )
  const r = rows[0]
  if (!r) throw apiError(event, 'NOT_FOUND', 'Aucun rapport pour ce contact.')
  if (r.status === 'revoked') throw apiError(event, 'NOT_FOUND', 'Le rapport a été révoqué.')

  const token = newToken()
  await db().query(`update report set token_hash = $2, updated_at = now() where id = $1`, [r.id, hashToken(token)])
  const rapport = await reportByToken(event, token)
  const envoi = await envoyerRapport(rapport, token, r.id)
  await audit(event, 'report.resend', 'report', r.id, { to: envoi.to, sent: envoi.sent, error: envoi.error ?? null })
  return { reportId: r.id, email: envoi }
})
