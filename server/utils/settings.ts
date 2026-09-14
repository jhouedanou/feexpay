/**
 * Réglages applicatifs lus côté serveur, avec cache de 60 s. Les clés secrètes ne sortent
 * jamais vers le navigateur : `reglagesPublics()` ne renvoie que ce que le tracking client
 * a besoin de connaître.
 */
let cache: { at: number; map: Record<string, string> } | null = null
const TTL_MS = 60_000

export async function reglages(): Promise<Record<string, string>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.map
  const { rows } = await db().query<{ key: string; value: string }>(`select key, value from app_setting`)
  cache = { at: Date.now(), map: Object.fromEntries(rows.map((r) => [r.key, r.value])) }
  return cache.map
}

export function invaliderReglages() {
  cache = null
}

export async function reglagesPublics() {
  const r = await reglages()
  return {
    trackingEnabled: r.tracking_enabled === 'true',
    ga4MeasurementId: r.ga4_measurement_id ?? '',
    metaPixelId: r.meta_pixel_id ?? '',
  }
}
