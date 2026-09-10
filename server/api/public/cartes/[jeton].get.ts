import { readSnapshot } from '../../../utils/results'

/**
 * GET /api/public/cartes/{jeton} — ce qu'une carte partagée peut dire d'elle-même.
 *
 * Rigoureusement rien de nominatif : le type de diagnostic, l'archétype ou le score. C'est ce
 * que la page `/carte/{jeton}` affiche à qui suit un lien de partage, et ce que les robots
 * d'aperçu lisent. Le rapport, lui, reste derrière son propre jeton.
 *
 * La projection passe par `readSnapshot`, comme les pages de résultat : le snapshot brut porte
 * des champs internes et une forme qui n'est pas celle de l'affichage.
 */
export default defineEventHandler(async (event) => {
  const jeton = getRouterParam(event, 'jeton')
  if (!jeton || jeton.length < 20) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')

  const { rows } = await db().query<{
    participation_id: string
    created_at: Date
    a_image: boolean
  }>(
    `select participation_id, created_at, image is not null as a_image
       from share_asset where jeton = $1`,
    [jeton],
  )
  const carte = rows[0]
  if (!carte) throw apiError(event, 'NOT_FOUND', 'Carte introuvable.')

  const { type, result } = await readSnapshot(event, carte.participation_id)
  const r = result as {
    archetype?: { code?: string; forces?: string }
    scoreAffiche?: number
    niveauAffiche?: string
    meteo?: string
  }
  const dirigeant = type === 'dirigeant'

  return {
    type,
    image: carte.a_image ? `/api/public/og/${jeton}` : null,
    titre: dirigeant
      ? `Profil de dirigeant : ${r.archetype?.code ?? ''}`.trim()
      : `Rayonnement : ${r.scoreAffiche ?? 0} / 100`,
    sousTitre: dirigeant ? (r.archetype?.forces ?? '') : (r.niveauAffiche ?? ''),
    meteo: dirigeant ? null : (r.meteo ?? null),
    creeLe: carte.created_at,
    correlation_id: event.context.correlationId,
  }
})
