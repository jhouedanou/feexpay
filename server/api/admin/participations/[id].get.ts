import { getVersion, scoreDirigeant, scoreRayonnement, toPublicDirigeant, toPublicRayonnement, type Answers } from '@radar/scoring'
import { requireAdmin } from '../../../utils/admin-auth'
import { identifiantParticipation, libelleSource } from '../../../utils/admin-metier'
import { engineAnswers } from '../../../utils/participation'

/** GET /api/admin/participations/:id — A06 : réponses dans l'ordre, résultat calculé, contexte technique. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event, 'lecture')
  const id = getRouterParam(event, 'id')!
  const { rows } = await db().query<Record<string, any>>(
    `select p.id, p.diagnostic_type, p.status, p.started_at, p.completed_at, p.duration_s, p.session_id, v.version,
            c.id as contact_id, c.prenom, c.nom, c.entreprise,
            a.utm_source, a.utm_medium, a.referrer, a.fbclid, a.gclid, a.device,
            i.items, s.tie_break,
            (select count(*) from answer_history h where h.participation_id = p.id) as retours
       from participation p
       join scoring_version v on v.id = p.version_id
       left join contact c on c.id = p.contact_id
       left join acquisition a on a.session_id = p.session_id
       left join insight_snapshot i on i.participation_id = p.id
       left join score_snapshot s on s.participation_id = p.id
      where p.id = $1`,
    [id],
  )
  const p = rows[0]
  if (!p) throw apiError(event, 'NOT_FOUND', 'Participation introuvable.')

  const reponses = await db().query<Record<string, any>>(
    `select q.code, q.ordre, q.texte as question, o.code as option_code, o.lettre, o.texte as reponse, o.mapping, a.answered_at, a.revised_at
       from question q
       left join answer a on a.question_id = q.id and a.participation_id = $1
       left join "option" o on o.id = a.option_id
      where q.version_id = (select version_id from participation where id = $1) and q.diagnostic_type = $2
      order by q.ordre`,
    [id, p.diagnostic_type],
  )
  const nomDim = new Map<string, string>()
  try {
    for (const d of getVersion(p.version).dimensions) nomDim.set(d.code, d.nom)
  } catch {}
  const difficultes = new Map<string, { code: string; gravite: number; difficulte: string }>()
  for (const d of p.items?.difficulties ?? []) difficultes.set(d.code, d)

  let resultat: Record<string, unknown> | null = null
  if (p.status === 'completed') {
    const answers = (await engineAnswers(id)) as Answers
    if (p.diagnostic_type === 'dirigeant') {
      const r = scoreDirigeant(answers, p.version)
      const pub = toPublicDirigeant(r)
      const [a, b] = r.affinities
      const ecart = a && b ? Math.round((a.value - b.value) * 10) / 10 : null
      resultat = {
        type: 'dirigeant',
        archetype: pub.archetype,
        secondaire: pub.secondaire,
        affinities: r.affinities,
        pilotage: r.pilotage,
        tieBreak: r.tieBreak,
        phrase: r.tieBreak
          ? `Égalité à ${r.tieBreak.affinite} entre ${r.tieBreak.exAequo.join(' et ')} : départagée par la règle « ${r.tieBreak.etapes.at(-1)?.regle} ».`
          : ecart !== null
            ? `Écart de ${ecart} point${ecart > 1 ? 's' : ''} avec le second profil : l’archétype principal est retenu sans ambiguïté.`
            : null,
      }
    } else {
      const r = scoreRayonnement(answers, p.version)
      resultat = { type: 'rayonnement', public: toPublicRayonnement(r, answers), dimensions: r.dimensions, score: r.score }
    }
  }

  return {
    id: p.id,
    identifiant: identifiantParticipation(p.id, p.started_at),
    type: p.diagnostic_type,
    status: p.status,
    version: p.version,
    startedAt: p.started_at,
    completedAt: p.completed_at,
    dureeS: p.duration_s,
    contact: p.contact_id ? { id: p.contact_id, prenom: p.prenom, nom: p.nom, entreprise: p.entreprise } : null,
    source: libelleSource(p),
    appareil: p.device,
    retours: Number(p.retours),
    reponses: reponses.rows.map((r) => {
      const d = r.option_code ? difficultes.get(r.option_code) : null
      const m = r.mapping ?? {}
      const dims = [m.dim1 && m.points ? `${nomDim.get(m.dim1) ?? m.dim1} +${m.points}` : null, m.dim2 && m.points ? `${nomDim.get(m.dim2) ?? m.dim2} +${Math.max(1, Math.round(m.points / 2))}` : null].filter(Boolean)
      const constat = m.constat ?? null
      return {
        code: r.code,
        ordre: r.ordre,
        question: r.question,
        reponse: r.reponse,
        lettre: r.lettre,
        optionCode: r.option_code,
        answeredAt: r.answered_at,
        revisedAt: r.revised_at,
        technique: r.option_code
          ? [`Option ${String('ABCD'.indexOf(r.lettre) + 1).padStart(2, '0')}`, ...dims, constat?.gravite ? `gravité ${constat.gravite}` : null].filter(Boolean).join(' · ')
          : null,
        constat: d ? { code: d.code, gravite: d.gravite, texte: d.difficulte } : constat && constat.nature !== 'Signal déclaré' && constat.nature !== 'Force' ? { code: r.option_code, gravite: constat.gravite ?? 0, texte: constat.difficulte ?? constat.factuel } : null,
        declenche: Boolean(d),
      }
    }),
    resultat,
  }
})
