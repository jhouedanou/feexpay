import { requireAdmin } from '../../../utils/admin-auth'
import { leviers } from '../../../utils/admin-metier'

/** GET /api/admin/leviers — table constat → produit (A05). Rôle Lecture seule. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'lecture')
  const dimensions = await db().query<{ dimension: string }>(
    `select distinct o.mapping->'constat'->>'dimension' as dimension
       from "option" o join question q on q.id = o.question_id join scoring_version v on v.id = q.version_id
      where v.status = 'published' and o.mapping->'constat'->>'nature' in ('Difficulté', 'Point de vigilance', 'Contexte')
      order by 1`,
  )
  return { leviers: await leviers(), dimensions: dimensions.rows.map((r) => r.dimension) }
})
