import { requireAdmin } from '../../../utils/admin-auth'
import { csv, journaliserExport } from '../../../utils/admin-metier'
import liste from '../prospects.get'

/** GET /api/admin/prospects/export?… — A03 « Exporter la sélection » : mêmes filtres, CSV journalisé. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event, 'commercial')
  if (!admin.user.export_allowed) throw apiError(event, 'FORBIDDEN_SCOPE', 'Export non autorisé pour ce compte.')
  const q = getQuery(event)
  // Toute la sélection, pas seulement la page affichée.
  event.node.req.url = event.node.req.url!.replace(/([?&])taille=\d+/, '$1') + (event.node.req.url!.includes('?') ? '&' : '?') + 'taille=100&page=1'
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
    if (page * 100 >= total) break
    page++
    event.node.req.url = event.node.req.url!.replace(/page=\d+/, `page=${page}`)
    const suite = (await liste(event)) as Awaited<ReturnType<typeof liste>>
    items = suite.items
    total = suite.total
  }
  await journaliserExport(event, { type: 'prospects', filtres: q }, String(q.motif ?? 'Export prospects'), lignes.length - 1)
  setHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setHeader(event, 'content-disposition', `attachment; filename="radar-prospects.csv"`)
  return csv(lignes)
})
