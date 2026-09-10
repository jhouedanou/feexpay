import { z } from 'zod'
import { audit, requireAdmin } from '../../../../utils/admin-auth'
import { chargerModele, CHAMPS_MODELE, DEFAUTS_MODELES, estCleModele } from '../../../../utils/modeles-email'

const Champ = z.string().trim().min(1, 'Un champ ne peut pas être vide.').max(1000, 'Un champ ne peut pas dépasser 1 000 caractères.')
const Body = z
  .object({
    sujet: Champ.pipe(z.string().max(200, 'Le sujet ne peut pas dépasser 200 caractères.')),
    titre: Champ,
    salutation: Champ,
    introduction: Champ,
    bouton: Champ.pipe(z.string().max(60, 'Le libellé du bouton ne peut pas dépasser 60 caractères.')),
    mention: Champ,
    pied: Champ,
  })
  .strict()

/**
 * PUT /api/admin/rapports/modeles/{cle} — réécrit les textes d'un modèle d'email. Rôle
 * Administrateur : ce texte part chez des prospects au nom de FeexPay.
 *
 * Seuls les champs qui diffèrent de l'origine sont conservés en base ; un modèle ramené
 * champ par champ à son texte d'origine redevient « non personnalisé » sans passer par la
 * route DELETE. Le contenu enregistré est journalisé, pour savoir qui a écrit quoi.
 */
export default defineEventHandler(async (event) => {
  const ctx = await requireAdmin(event, 'admin')
  const cle = getRouterParam(event, 'cle')
  if (!estCleModele(cle)) throw apiError(event, 'NOT_FOUND', 'Modèle inconnu.')
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) throw apiError(event, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Modèle invalide.')

  const defauts = DEFAUTS_MODELES[cle]
  const reecrits: Record<string, string> = {}
  for (const champ of CHAMPS_MODELE) {
    if (parsed.data[champ] !== defauts[champ]) reecrits[champ] = parsed.data[champ]
  }

  if (Object.keys(reecrits).length === 0) {
    await db().query(`delete from email_template where cle = $1`, [cle])
  } else {
    await db().query(
      `insert into email_template (cle, champs, updated_at, updated_by) values ($1, $2, now(), $3)
       on conflict (cle) do update set champs = excluded.champs, updated_at = now(), updated_by = excluded.updated_by`,
      [cle, JSON.stringify(reecrits), ctx.user.id],
    )
  }
  await audit(event, 'email_template.updated', 'email_template', cle, { champs: reecrits })

  const m = await chargerModele(cle)
  return { cle, champs: m.champs, personnalise: m.personnalise, modifieLe: m.modifieLe, modifiePar: m.modifiePar, correlation_id: event.context.correlationId }
})
