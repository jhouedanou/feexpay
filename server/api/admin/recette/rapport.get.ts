import { requireAdmin } from '../../../utils/admin-auth'
import { recettePdf } from '../../../utils/pdf'
import recette from '../../../data/recette.json'

/** GET /api/admin/recette/rapport — le rapport PDF du testeur connecté : ses résultats, ses anomalies. */
export default defineEventHandler(async (event) => {
  const ctx = await requireAdmin(event, 'lecture')
  const { rows } = await db().query<{ controle: string; statut: 'ok' | 'ko' | 'passe'; note: string; updated_at: Date }>(
    `select controle, statut, note, updated_at from recette_resultat where testeur_id = $1`,
    [ctx.user.id],
  )
  const par = new Map(rows.map((r) => [r.controle, r]))
  const pdf = recettePdf({
    testeur: `${ctx.user.prenom} ${ctx.user.nom}`.trim(),
    version: recette.version,
    adresse: recette.adresse,
    etabliLe: new Date(),
    sections: recette.sections.map((s) => ({
      num: s.num,
      titre: s.titre,
      controles: s.controles.map((c) => {
        const r = par.get(c.k)
        return { k: c.k, etape: c.etape, resultat: r ? { statut: r.statut, note: r.note, at: r.updated_at } : null }
      }),
    })),
  })
  const nom = ctx.user.prenom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')
  setHeader(event, 'content-type', 'application/pdf')
  setHeader(event, 'content-disposition', `attachment; filename="radar-recette-${nom || 'testeur'}.pdf"`)
  return pdf
})
