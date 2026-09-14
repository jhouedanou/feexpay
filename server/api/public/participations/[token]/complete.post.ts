import {
  buildInsights,
  scoreDirigeant,
  scoreRayonnement,
  toPublicDirigeant,
  toPublicRayonnement,
  type Answers,
} from '@radar/scoring'

/**
 * POST /api/public/participations/{token}/complete — calcule, fige le snapshot, renvoie
 * la projection publique. Idempotent : un second appel relit le snapshot existant
 * (immuable en base par trigger) au lieu de recalculer.
 *
 * Le calcul est fait par le moteur pur, jamais côté client : seul ce qui est destiné
 * à l'affichage sort d'ici (pas de pilotage, d'affinités, de tie-break ni d'hypothèses).
 */
import { envoyerCapi } from '../../../../utils/capi'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw apiError(event, 'VALIDATION_ERROR', 'Jeton manquant.')

  const session = await requireSession(event)
  const p = await participationByToken(event, token, session.id)
  const corps = (await readBody(event).catch(() => null)) as { eventId?: string } | null
  const eventId = typeof corps?.eventId === 'string' && /^[0-9a-f-]{36}$/i.test(corps.eventId) ? corps.eventId : undefined

  if (p.status === 'completed') {
    return { ...(await readSnapshot(event, p.id)), alreadyCompleted: true }
  }

  const answers = (await engineAnswers(p.id)) as Answers
  const expected = QUESTION_COUNT[p.diagnostic_type]
  if (Object.keys(answers).length !== expected) {
    throw apiError(
      event,
      'INCOMPLETE_PARTICIPATION',
      `${Object.keys(answers).length} réponse(s) sur ${expected} : aucun calcul.`
    )
  }

  const result =
    p.diagnostic_type === 'dirigeant'
      ? scoreDirigeant(answers, p.version)
      : scoreRayonnement(answers, p.version)

  const insights = buildInsights(
    p.diagnostic_type === 'dirigeant'
      ? { version: p.version, dirigeant: answers }
      : { version: p.version, rayonnement: answers }
  )

  const publicResult =
    result.type === 'dirigeant' ? toPublicDirigeant(result) : toPublicRayonnement(result)

  await tx(async (c) => {
    // Deux participations complétées en parallèle : la contrainte unique tranche.
    const done = await c.query(
      `update participation
          set status = 'completed',
              completed_at = now(),
              duration_s = greatest(0, extract(epoch from (now() - started_at))::int)
        where id = $1 and status <> 'completed'`,
      [p.id]
    )
    if (done.rowCount === 0) return

    const { scores, resume } = splitSnapshot(result)
    await c.query(
      `insert into score_snapshot (participation_id, version_id, scores, result, tie_break)
       values ($1, $2, $3, $4, $5)`,
      [
        p.id,
        p.version_id,
        JSON.stringify(scores),
        JSON.stringify(resume),
        result.type === 'dirigeant' && result.tieBreak ? JSON.stringify(result.tieBreak) : null,
      ]
    )
    await c.query(
      `insert into insight_snapshot (participation_id, version_id, items) values ($1, $2, $3)`,
      [p.id, p.version_id, JSON.stringify(insights)]
    )
  })

  setResponseStatus(event, 201)
  await envoyerCapi(event, 'quiz_completed', eventId, {}, { diagnostic: p.diagnostic_type })

  return {
    token,
    type: p.diagnostic_type,
    status: 'completed' as const,
    result: publicResult,
    alreadyCompleted: false,
    // Identifiant d'évènement pour le tracking (déduplication client/CAPI, Lot 7).
    eventId: `diag_${p.id}`,
    event_id: `diag_${p.id}`,
    correlation_id: event.context.correlationId,
  }
})

/** Sépare ce qui est archivé « brut » (scores) de la conclusion (result). */
function splitSnapshot(result: ReturnType<typeof scoreDirigeant> | ReturnType<typeof scoreRayonnement>) {
  if (result.type === 'dirigeant') {
    const { raw, norm, affinities, pilotage, principal, secondaire } = result
    return {
      scores: { raw, norm, affinities, pilotage },
      resume: { type: 'dirigeant', principal, secondaire },
    }
  }
  const { dimensions, score, scoreAffiche, niveau, meteo, lecture, nuance, niveauAffiche } = result
  return {
    scores: { dimensions, score },
    resume: {
      type: 'rayonnement',
      scoreAffiche,
      niveau,
      niveauAffiche,
      meteo,
      lecture,
      nuance,
      differenciationDeclaree: result.differenciationDeclaree,
    },
  }
}
