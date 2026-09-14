import { requireAdmin } from '../../../utils/admin-auth'
import { csv, journaliserExport } from '../../../utils/admin-metier'
import dashboard from '../dashboard.get'

/** GET /api/admin/dashboard/export?jours=18 — A02 « Exporter » : indicateurs de la période en CSV, journalisé. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event, 'commercial')
  if (!admin.user.export_allowed) throw apiError(event, 'FORBIDDEN_SCOPE', 'Export non autorisé pour ce compte.')
  const d = (await dashboard(event)) as Awaited<ReturnType<typeof dashboard>>
  const lignes: (string | number)[][] = [['Indicateur', 'Période', 'Période précédente']]
  const k = d.kpi
  lignes.push(['Participants uniques', k.actuel.participants, k.precedent.participants])
  lignes.push(['Taux de complétion (%)', k.actuel.completion, k.precedent.completion])
  lignes.push(['Conversion résultat vers prospect (%)', k.actuel.conversion, k.precedent.conversion])
  lignes.push(['Deux diagnostics réalisés (%)', k.actuel.deuxPct, k.precedent.deuxPct])
  lignes.push([])
  lignes.push(['Entonnoir', 'Volume'])
  for (const e of d.entonnoir) lignes.push([e.label, e.n])
  lignes.push([])
  lignes.push(['Archétype', 'Volume'])
  for (const a of d.archetypes) lignes.push([a.code, a.n])
  lignes.push([])
  lignes.push(['Niveau de rayonnement', '%'])
  for (const n of d.niveaux) lignes.push([n.niveau, n.pct])
  lignes.push([])
  lignes.push(['Lecture croisée', '%'])
  for (const c of d.croisees) lignes.push([`${c.code} · ${c.label}`, c.pct])
  lignes.push([])
  lignes.push(['Source', 'Démarrages', 'Conversion (%)'])
  for (const s of d.acquisition) lignes.push([s.source, s.demarrages, s.conversion])

  await journaliserExport(event, { type: 'dashboard', jours: d.periode.jours }, 'Export dashboard', lignes.length)
  setHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setHeader(event, 'content-disposition', `attachment; filename="radar-dashboard-${d.periode.jours}j.csv"`)
  return csv(lignes)
})
