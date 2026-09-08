import { CURRENT_VERSION, getVersion } from '@radar/scoring'

// Sonde de socle : confirme que le moteur pur est câblé et que la version publiée
// en base porte bien le même checksum que les JSON embarqués.
export default defineEventHandler(async () => {
  const engine = getVersion()
  const config = useRuntimeConfig()

  let db: { status: string; version?: string; checksum?: string } = { status: 'not_configured' }
  if (config.supabaseUrl && config.supabaseServiceKey) {
    try {
      const rows = await $fetch<{ version: string; status: string; checksum: string }[]>(
        `${config.supabaseUrl}/rest/v1/scoring_version`,
        {
          query: { select: 'version,status,checksum', status: 'eq.published' },
          headers: {
            apikey: config.supabaseServiceKey,
            Authorization: `Bearer ${config.supabaseServiceKey}`,
          },
        }
      )
      const published = rows[0]
      db = published
        ? { status: 'ok', version: published.version, checksum: published.checksum.slice(0, 12) }
        : { status: 'no_published_version' }
    } catch {
      db = { status: 'unreachable' }
    }
  }

  return {
    status: 'ok',
    scoringVersion: CURRENT_VERSION,
    checksum: engine.checksum.slice(0, 12),
    db,
    checksumMatch: db.checksum ? db.checksum === engine.checksum.slice(0, 12) : null,
  }
})
