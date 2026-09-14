import { requireAdmin } from '../../../utils/admin-auth'
import { csv, journaliserExport } from '../../../utils/admin-metier'
import liste from '../prospects.get'

/** GET /api/admin/prospects/export?… — A03 « Exporter la sélection » : mêmes filtres, CSV journalisé. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event, 'commercial')
  if (!admin.user.export_allowed) throw apiError(event, 'FORBIDDEN_SCOPE', 'Export non autorisé pour ce compte.')
  const q = getQuery(event)
  // Toute la sélection, pas seulement la page affichée. La pagination est imposée par le
  // contexte : la réécriture de `req.url` employée jusqu'ici n'avait aucun effet, h3 mettant
  // le chemin en cache au routage. L'export s'arrêtait donc silencieusement à 20 lignes.
  const PAR_PAGE = 100
  const pageDe = (n: number) => ({ ...q, taille: String(PAR_PAGE), page: String(n) })
  event.context.prospectsQuery = pageDe(1)
  const d = (await liste(event)) as Awaited<ReturnType<typeof liste>>
  const lignes: (string | number | null)[][] = [
    ['Prénom', 'Nom', 'Email', 'Téléphone', 'Entreprise', 'Secteur', 'Taille', 'Profil', 'Pilotage', 'Niveau de pilotage', 'Rayonnement', 'Niveau de rayonnement', 'Deux diagnostics', 'Difficulté prioritaire', 'Gravité', 'Rapport', 'Source', 'Créé le'],
  ]
  let page = 1
  let items = d.items
  let total = d.total
  while (items.length) {
    for (const i of items) {
      lignes.push([i.prenom, i.nom, i.email, i.telephone, i.entreprise, i.secteur, i.taille, i.profil, i.pilotage, i.pilotageNiveau, i.rayonnement, i.rayonnementNiveau, i.deux ? 'oui' : 'non', i.difficulte?.texte ?? null, i.difficulte?.gravite ?? null, i.rapport, i.source, new Date(i.creeLe).toISOString()])
    }
    if (page * PAR_PAGE >= total) break
    page++
    event.context.prospectsQuery = pageDe(page)
    const suite = (await liste(event)) as Awaited<ReturnType<typeof liste>>
    items = suite.items
    total = suite.total
  }
  await journaliserExport(event, { type: 'prospects', filtres: q }, String(q.motif ?? 'Export prospects'), lignes.length - 1)
  setHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setHeader(event, 'content-disposition', `attachment; filename="radar-prospects.csv"`)
  return csv(lignes)
})
