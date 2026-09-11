import { requireAdmin } from '../../../utils/admin-auth'
import recette from '../../../data/recette.json'

/**
 * GET /api/admin/recette — la liste des contrôles de recette et les résultats de tous les
 * testeurs. Ouvert à tous les rôles : chaque membre de l'équipe est testeur.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'lecture')
  const { rows } = await db().query<{ controle: string; testeur_id: string; testeur: string; statut: string; note: string; updated_at: Date }>(
    `select r.controle, r.testeur_id, u.prenom as testeur, r.statut, r.note, r.updated_at
       from recette_resultat r join admin_user u on u.id = r.testeur_id
      order by r.updated_at desc`,
  )
  return { ...recette, resultats: rows, correlation_id: event.context.correlationId }
})
