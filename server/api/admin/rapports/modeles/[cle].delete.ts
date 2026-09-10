import { audit, requireAdmin } from '../../../../utils/admin-auth'
import { chargerModele, estCleModele } from '../../../../utils/modeles-email'

/** DELETE /api/admin/rapports/modeles/{cle} — rétablit les textes d'origine d'un modèle. Rôle Administrateur. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'admin')
  const cle = getRouterParam(event, 'cle')
  if (!estCleModele(cle)) throw apiError(event, 'NOT_FOUND', 'Modèle inconnu.')
  const r = await db().query(`delete from email_template where cle = $1`, [cle])
  if (r.rowCount) await audit(event, 'email_template.reset', 'email_template', cle)
  const m = await chargerModele(cle)
  return { cle, champs: m.champs, personnalise: m.personnalise, modifieLe: m.modifieLe, modifiePar: m.modifiePar, correlation_id: event.context.correlationId }
})
