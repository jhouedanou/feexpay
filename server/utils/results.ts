import type { H3Event } from 'h3'
import {
  scoreDirigeant,
  scoreRayonnement,
  toPublicDirigeant,
  toPublicRayonnement,
  type Answers,
} from '@radar/scoring'

/**
 * Relit un résultat déjà figé. Le snapshot en base reste l'archive faisant foi (il est
 * immuable par trigger) ; la projection d'affichage est recalculée par le moteur à partir
 * des mêmes réponses et de la même version publiée — déterministe par construction, donc
 * identique. Rien n'est réécrit : un second `complete` ne crée pas un second snapshot.
 */
export async function readSnapshot(event: H3Event, participationId: string) {
  const { rows } = await db().query<{
    token_never_returned: null
    type: 'dirigeant' | 'rayonnement'
    version: string
    has_snapshot: boolean
  }>(
    `select p.diagnostic_type as type, v.version,
            exists(select 1 from score_snapshot s where s.participation_id = p.id) as has_snapshot,
            null as token_never_returned
       from participation p join scoring_version v on v.id = p.version_id
      where p.id = $1`,
    [participationId]
  )
  const meta = rows[0]
  if (!meta) throw apiError(event, 'NOT_FOUND', 'Participation introuvable.')
  if (!meta.has_snapshot) {
    throw apiError(event, 'INCOMPLETE_PARTICIPATION', 'Aucun résultat figé pour ce parcours.')
  }

  const answers = (await engineAnswers(participationId)) as Answers
  const result =
    meta.type === 'dirigeant'
      ? toPublicDirigeant(scoreDirigeant(answers, meta.version))
      : toPublicRayonnement(scoreRayonnement(answers, meta.version), answers)

  return {
    type: meta.type,
    status: 'completed' as const,
    result,
    eventId: `diag_${participationId}`,
    event_id: `diag_${participationId}`,
    correlation_id: event.context.correlationId,
  }
}
