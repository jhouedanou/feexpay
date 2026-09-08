import { z } from 'zod'
import {
  crossReading,
  scoreDirigeant,
  scoreRayonnement,
  type Answers,
} from '@radar/scoring'
import { envoyerRapport } from '../../utils/email'
import { reportByToken } from '../../utils/report'

/**
 * POST /api/public/leads — P10. Rapproche un contact, ouvre un rapport et calcule la
 * lecture croisée si les deux diagnostics de la session sont complétés.
 *
 * Rapprochement : par email normalisé d'abord, par téléphone ensuite. Une ambiguïté
 * (email inconnu mais téléphone déjà vu sur un autre contact) est **signalée** dans
 * `match_conflict`, jamais fusionnée automatiquement — la décision revient à un humain.
 *
 * Idempotence : l'en-tête `Idempotency-Key` évite qu'un double clic crée deux rapports.
 */
const Body = z
  .object({
    participationToken: z.string().min(20),
    prenom: z.string().trim().min(1).max(120),
    nom: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(320),
    // E.164 : indicatif obligatoire, 7 à 15 chiffres.
    phone: z
      .string()
      .trim()
      .regex(/^\+[1-9][0-9]{6,14}$/, 'Numéro attendu au format international, ex. +2250700000000'),
    entreprise: z.string().trim().min(1).max(200),
    secteur: z.string().trim().min(1).max(120),
    secteurAutre: z.string().trim().max(200).optional(),
    taille: z.enum(['Seul', '2 à 5', '6 à 20', '21 à 50', 'Plus de 50']),
  })
  .strict()

export default defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) {
    throw apiError(event, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Formulaire invalide.')
  }
  const b = parsed.data
  const emailNorm = b.email.toLowerCase()

  const session = await requireSession(event)
  const p = await participationByToken(event, b.participationToken, session.id)
  if (p.status !== 'completed') {
    throw apiError(event, 'INCOMPLETE_PARTICIPATION', 'Le diagnostic n’est pas terminé.')
  }

  // Une même clé rejouée renvoie le rapport déjà créé plutôt qu'un doublon.
  const idempotencyKey = getRequestHeader(event, 'idempotency-key') ?? null

  const reportToken = newToken()

  const out = await tx(async (c) => {
    // --- Contact : rapprochement, jamais de fusion automatique ---------------
    const byEmail = await c.query<{ id: string; phone_e164: string | null }>(
      `select id, phone_e164 from contact where email_norm = $1`,
      [emailNorm]
    )

    let contactId: string
    let conflit: Record<string, unknown> | null = null

    if (byEmail.rowCount) {
      contactId = byEmail.rows[0]!.id
      const connu = byEmail.rows[0]!.phone_e164
      if (connu && connu !== b.phone) {
        conflit = { phone_seen: connu, phone_submitted: b.phone, at: new Date().toISOString() }
      }
      await c.query(
        `update contact set prenom = $2, nom = $3, entreprise = $4, secteur = $5,
                            secteur_autre = $6, taille = $7,
                            phone_e164 = coalesce(phone_e164, $8),
                            match_conflict = coalesce($9::jsonb, match_conflict)
          where id = $1`,
        [
          contactId, b.prenom, b.nom, b.entreprise, b.secteur,
          b.secteurAutre ?? null, b.taille, b.phone,
          conflit ? JSON.stringify(conflit) : null,
        ]
      )
    } else {
      // Email inconnu : le téléphone peut appartenir à un contact existant.
      const byPhone = await c.query<{ id: string; email_norm: string }>(
        `select id, email_norm::text from contact where phone_e164 = $1 limit 1`,
        [b.phone]
      )
      if (byPhone.rowCount) {
        conflit = {
          reason: 'phone_matches_other_contact',
          other_contact_id: byPhone.rows[0]!.id,
          other_email: byPhone.rows[0]!.email_norm,
          at: new Date().toISOString(),
        }
      }
      const ins = await c.query<{ id: string }>(
        `insert into contact (prenom, nom, email_norm, phone_e164, entreprise, secteur,
                              secteur_autre, taille, match_conflict)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
        [
          b.prenom, b.nom, emailNorm, b.phone, b.entreprise, b.secteur,
          b.secteurAutre ?? null, b.taille, conflit ? JSON.stringify(conflit) : null,
        ]
      )
      contactId = ins.rows[0]!.id
    }

    // --- Participations de la session, rattachées au contact -----------------
    await c.query(
      `update participation set contact_id = $1
        where session_id = $2 and status = 'completed' and contact_id is null`,
      [contactId, session.id]
    )

    const completees = await c.query<{
      id: string
      diagnostic_type: 'dirigeant' | 'rayonnement'
      version: string
      snapshot_id: string
    }>(
      `select p.id, p.diagnostic_type, v.version, s.id as snapshot_id
         from participation p
         join scoring_version v on v.id = p.version_id
         join score_snapshot s on s.participation_id = p.id
        where p.session_id = $1 and p.status = 'completed'`,
      [session.id]
    )

    // Un rapport déjà ouvert pour ce contact et ces mêmes snapshots est réutilisé.
    const dejaOuvert = await c.query<{ id: string }>(
      `select id from report
        where contact_id = $1 and status <> 'revoked'
          and snapshot_refs->>'idempotency_key' is not distinct from $2
        order by created_at desc limit 1`,
      [contactId, idempotencyKey]
    )
    if (dejaOuvert.rowCount && idempotencyKey) {
      // Le jeton d'origine n'est pas récupérable (seul son hash est stocké) : on en émet
      // un nouveau sur le même rapport, plutôt que d'en créer un second.
      await c.query(`update report set token_hash = $1 where id = $2`, [
        hashToken(reportToken),
        dejaOuvert.rows[0]!.id,
      ])
      return {
        contactId,
        reportId: dejaOuvert.rows[0]!.id,
        token: reportToken,
        croisement: null,
        rejoue: true,
      }
    }

    // --- Lecture croisée si la paire est complète ----------------------------
    let croisement: { code: string; qualificatif: string } | null = null
    const dir = completees.rows.find((r) => r.diagnostic_type === 'dirigeant')
    const ray = completees.rows.find((r) => r.diagnostic_type === 'rayonnement')

    if (dir && ray && dir.version === ray.version) {
      const rDir = scoreDirigeant((await engineAnswers(dir.id)) as Answers, dir.version)
      const rRay = scoreRayonnement((await engineAnswers(ray.id)) as Answers, ray.version)
      const cr = crossReading(rDir, rRay)
      await c.query(
        `insert into cross_reading (contact_id, participation_dirigeant_id,
                                    participation_rayonnement_id, code, pilotage,
                                    rayonnement, ecart, qualificatif)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (participation_dirigeant_id, participation_rayonnement_id) do nothing`,
        [
          contactId, dir.id, ray.id, cr.code,
          rDir.pilotage.score, rRay.score, rRay.score - rDir.pilotage.score, cr.qualificatif,
        ]
      )
      croisement = { code: cr.code, qualificatif: cr.qualificatif }
    }

    const report = await c.query<{ id: string }>(
      `insert into report (contact_id, snapshot_refs, token_hash, editorial_version)
       values ($1, $2, $3, $4) returning id`,
      [
        contactId,
        JSON.stringify({
          score_snapshot_ids: completees.rows.map((r) => r.snapshot_id),
          idempotency_key: idempotencyKey,
        }),
        hashToken(reportToken),
        completees.rows[0]?.version ?? '2.1',
      ]
    )

    return { contactId, reportId: report.rows[0]!.id, token: reportToken, croisement }
  })

  // Envoi du rapport : PDF joint, lien vers P12. Un échec d'envoi ne bloque pas la
  // remise du rapport en ligne, il est journalisé dans `notification`.
  let email: { sent: boolean; to: string; error?: string } = { sent: false, to: emailNorm }
  if (!out.rejoue) {
    try {
      const rapport = await reportByToken(event, out.token)
      email = await envoyerRapport(rapport, out.token, out.reportId)
    } catch (e) {
      email = { sent: false, to: emailNorm, error: e instanceof Error ? e.message : String(e) }
    }
  }

  setResponseStatus(event, 201)
  return {
    reportToken: out.token,
    email: { sent: email.sent, to: email.to },
    croisement: out.croisement,
    correlation_id: event.context.correlationId,
  }
})
