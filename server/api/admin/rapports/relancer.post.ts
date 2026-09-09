import { audit, requireAdmin } from '../../../utils/admin-auth'
import { renvoyerRapport } from '../../../utils/rapports'

/**
 * POST /api/admin/rapports/relancer — A07 « Relancer les N échecs » : renvoie chaque rapport
 * dont le dernier envoi a échoué (adresses rejetées exclues : elles exigent une correction).
 * Cinquante au plus par appel, journalisé. Rôle Commercial.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'commercial')
  const { rows } = await db().query<{ report_id: string }>(
    `select n.report_id from notification n join report r on r.id = n.report_id
      where n.status = 'failed' and r.status <> 'revoked'
        and n.created_at = (select max(created_at) from notification x where x.report_id = n.report_id)
      order by n.created_at desc limit 50`,
  )
  const resultats: { reportId: string; sent: boolean; error?: string }[] = []
  for (const r of rows) {
    try {
      const x = await renvoyerRapport(event, r.report_id)
      resultats.push({ reportId: r.report_id, sent: x.email.sent, error: x.email.error })
    } catch (e) {
      resultats.push({ reportId: r.report_id, sent: false, error: e instanceof Error ? e.message : String(e) })
    }
  }
  await audit(event, 'report.retry_failed', 'report', null, { n: rows.length, envoyes: resultats.filter((r) => r.sent).length })
  return { total: rows.length, envoyes: resultats.filter((r) => r.sent).length, resultats }
})
