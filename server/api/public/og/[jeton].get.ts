/**
 * GET /api/public/og/{jeton} — image d'aperçu d'une carte partagée.
 *
 * Servie aux robots de WhatsApp, LinkedIn et consorts, qui lisent la balise `og:image` de
 * `/carte/{jeton}`. L'image est celle que le navigateur a dessinée et envoyée : la même que
 * celle vue par l'internaute, au format bannière.
 *
 * Elle ne porte aucune donnée personnelle — archétype ou score, et la marque.
 */
export default defineEventHandler(async (event) => {
  const jeton = (getRouterParam(event, 'jeton') ?? '').replace(/\.png$/, '')
  if (!jeton || jeton.length < 20) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')

  const { rows } = await db().query<{ image: Buffer | null; image_type: string | null }>(
    `select image, image_type from share_asset where jeton = $1`,
    [jeton],
  )
  const carte = rows[0]
  if (!carte?.image) throw apiError(event, 'NOT_FOUND', 'Carte introuvable.')

  setResponseHeader(event, 'Content-Type', carte.image_type ?? 'image/png')
  // Une carte ne change pas : les robots d'aperçu la mettent en cache pour longtemps.
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return carte.image
})
