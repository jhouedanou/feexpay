import { z } from 'zod'
import { audit, requireAdmin } from '../../../utils/admin-auth'
import { leviers } from '../../../utils/admin-metier'

/** PUT /api/admin/leviers — remplace la table des leviers et leurs rattachements. Rôle Administrateur. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event, 'admin')
  const body = z
    .object({
      leviers: z
        .array(
          z.object({
            code: z.string().trim().regex(/^[a-z0-9-]{2,40}$/),
            nom: z.string().trim().min(1).max(80),
            icone: z.string().trim().min(1).max(60),
            description: z.string().trim().min(1).max(500),
            actif: z.boolean().default(true),
            dimensions: z.array(z.object({ dimension: z.string().trim().min(1).max(80), role: z.enum(['traite', 'support']) })).default([]),
          }),
        )
        .max(20),
    })
    .parse(await readBody(event))

  await tx(async (c) => {
    const codes = body.leviers.map((l) => l.code)
    await c.query(`delete from levier_feexpay where not (code = any($1::text[]))`, [codes])
    for (const [i, l] of body.leviers.entries()) {
      const { rows } = await c.query<{ id: string }>(
        `insert into levier_feexpay (code, nom, icone, description, ordre, actif, updated_by, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, now())
         on conflict (code) do update set nom = $2, icone = $3, description = $4, ordre = $5, actif = $6, updated_by = $7, updated_at = now()
         returning id`,
        [l.code, l.nom, l.icone, l.description, i + 1, l.actif, admin.user.id],
      )
      const id = rows[0]!.id
      await c.query(`delete from levier_constat where levier_id = $1`, [id])
      const vus = new Set<string>()
      for (const d of l.dimensions) {
        if (vus.has(d.dimension)) continue
        vus.add(d.dimension)
        await c.query(`insert into levier_constat (levier_id, dimension, role) values ($1, $2, $3)`, [id, d.dimension, d.role])
      }
    }
  })
  await audit(event, 'leviers.update', 'levier_feexpay', null, { n: body.leviers.length })
  return { leviers: await leviers() }
})
