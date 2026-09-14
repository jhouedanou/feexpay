import { z } from 'zod'
import { audit, requireAdmin } from '../../../../../utils/admin-auth'
import { chargerModele, estCleModele } from '../../../../../utils/modeles-email'

const Body = z.object({ actif: z.boolean() }).strict()

/**
 * POST /api/admin/rapports/modeles/{cle}/actif — active ou désactive un modèle d'email.
 * Rôle Administrateur. Un modèle désactivé n'envoie plus d'email ; les rapports continuent
 * d'être produits et lisibles en ligne. Les textes réécrits sont conservés.
 */
export default defineEventHandler(async (event) => {
  const ctx = await requireAdmin(event, 'admin')
  const cle = getRouterParam(event, 'cle')
  if (!estCleModele(cle)) throw apiError(event, 'NOT_FOUND', 'Modèle inconnu.')
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', '`actif` doit être un booléen.')

  await db().query(
    `insert into email_template (cle, champs, actif, updated_at, updated_by) values ($1, '{}'::jsonb, $2, now(), $3)
     on conflict (cle) do update set actif = excluded.actif, updated_at = now(), updated_by = excluded.updated_by`,
    [cle, parsed.data.actif, ctx.user.id],
  )
  // Une ligne active sans réécriture ne dit plus rien : l'absence de ligne a le même sens.
  await db().query(`delete from email_template where cle = $1 and actif and champs = '{}'::jsonb`, [cle])
  await audit(event, parsed.data.actif ? 'email_template.enabled' : 'email_template.disabled', 'email_template', cle)

  const m = await chargerModele(cle)
  return { cle, actif: m.actif, personnalise: m.personnalise, modifieLe: m.modifieLe, modifiePar: m.modifiePar, correlation_id: event.context.correlationId }
})
