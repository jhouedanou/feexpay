import { audit, requireAdmin } from '../../../../utils/admin-auth'
import { chargerModele, estCleModele } from '../../../../utils/modeles-email'

/** DELETE /api/admin/rapports/modeles/{cle} — rétablit les textes d'origine d'un modèle. Rôle Administrateur. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'admin')
  const cle = getRouterParam(event, 'cle')
  if (!estCleModele(cle)) throw apiError(event, 'NOT_FOUND', 'Modèle inconnu.')
  // Les textes reviennent à l'origine ; un modèle désactivé le reste.
  const r = await db().query(`update email_template set champs = '{}'::jsonb, updated_at = now() where cle = $1 and champs <> '{}'::jsonb`, [cle])
  await db().query(`delete from email_template where cle = $1 and actif`, [cle])
  if (r.rowCount) await audit(event, 'email_template.reset', 'email_template', cle)
  const m = await chargerModele(cle)
  return { cle, champs: m.champs, personnalise: m.personnalise, actif: m.actif, modifieLe: m.modifieLe, modifiePar: m.modifiePar, correlation_id: event.context.correlationId }
})
