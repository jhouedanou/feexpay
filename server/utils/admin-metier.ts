import type { H3Event } from 'h3'
import {
  crossReading,
  scoreDirigeant,
  scoreRayonnement,
  toPublicDirigeant,
  toPublicRayonnement,
  type Answers,
  type Difficulty,
  type Force,
  type Hypothesis,
  type InsightSnapshot,
} from '@radar/scoring'
import { engineAnswers } from './participation'

/**
 * Lot 5 admin métier : lectures partagées par le dashboard (A02), la liste des prospects
 * (A03), la fiche (A04/A05) et le détail de participation (A06).
 *
 * Les scores sont recalculés par le moteur depuis les réponses figées, comme côté public ;
 * les constats viennent de `insight_snapshot` (figé à la complétion). Les scores internes
 * (pilotage, affinités, tie-break) sont réservés à l'admin : rien d'ici ne sort en public.
 */

export const NIVEAUX_RAYONNEMENT = ['Dominant', 'Challenger fort', 'Acteur silencieux', 'Marque fragile', 'Zone de disparition']
export const NIVEAUX_PILOTAGE = ['Pilotage structuré', 'Pilotage partiellement structuré', 'Pilotage réactif', 'Pilotage informel']
export const ARCHETYPES = ['Stratège', 'Visionnaire', 'Bâtisseur', 'Conquérant', 'Fédérateur', 'Résilient', 'Gestionnaire', 'Réformateur']
export const LECTURES_CROISEES: Record<string, string> = {
  CC: 'Cohérence consolidée',
  PS: 'Potentiel sous-exploité',
  RT: 'Rayonnement sous tension',
  FR: 'Fondations à renforcer',
}
export const STATUTS_SUIVI: Record<string, string> = {
  a_contacter: 'À contacter',
  en_cours: 'En cours',
  rendez_vous: 'Rendez-vous pris',
  converti: 'Converti',
  sans_suite: 'Sans suite',
}

/** Identifiant lisible d'une participation (maquette A06 : « PRT-2026-004182 »). */
export function identifiantParticipation(id: string, startedAt: Date | string): string {
  const annee = new Date(startedAt).getFullYear()
  return `PRT-${annee}-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
}

/** Libellé court de la source d'acquisition (« meta / cpc », « direct », « non renseigné »). */
export function libelleSource(a: { utm_source?: string | null; utm_medium?: string | null; referrer?: string | null; fbclid?: string | null; gclid?: string | null } | null | undefined): string {
  if (!a) return 'non renseigné'
  if (a.utm_source) return a.utm_medium ? `${a.utm_source} / ${a.utm_medium}` : a.utm_source
  if (a.fbclid) return 'meta / clic'
  if (a.gclid) return 'google / clic'
  if (a.referrer) {
    try {
      return new URL(a.referrer).hostname.replace(/^www\./, '')
    } catch {
      return a.referrer
    }
  }
  return a.utm_source === null || a.referrer === null ? 'direct' : 'non renseigné'
}

export interface Constat extends Difficulty {
  /** Diagnostic d'origine du constat. */
  diagnostic: 'dirigeant' | 'rayonnement'
}

/** Difficultés des deux diagnostics, ordonnées par gravité décroissante puis ordre de question. */
export function constatsTries(dir: InsightSnapshot | null, ray: InsightSnapshot | null): Constat[] {
  const tous: Constat[] = [
    ...(dir?.difficulties ?? []).map((d) => ({ ...d, diagnostic: 'dirigeant' as const })),
    ...(ray?.difficulties ?? []).map((d) => ({ ...d, diagnostic: 'rayonnement' as const })),
  ]
  return tous.sort((a, b) => b.gravite - a.gravite || a.diagnostic.localeCompare(b.diagnostic) || numeroQuestion(a.questionCode) - numeroQuestion(b.questionCode))
}

export const numeroQuestion = (code: string) => Number.parseInt(code.replace(/\D/g, ''), 10) || 0

/** Priorité commerciale (A04 badge, A05 bloc « Priorité commerciale »). */
export function prioriteCommerciale(constats: Constat[], deuxDiagnostics: boolean, whatsapp: boolean) {
  const g3 = constats.filter((c) => c.gravite >= 3).length
  const g2 = constats.filter((c) => c.gravite === 2).length
  const niveau = g3 > 0 ? 'Élevée' : g2 > 0 ? 'Moyenne' : 'Faible'
  const parts: string[] = []
  if (g3) parts.push(`${g3 === 1 ? 'Un constat' : `${g3} constats`} de gravité 3 non traité${g3 > 1 ? 's' : ''}`)
  else if (g2) parts.push(`${g2 === 1 ? 'Un constat' : `${g2} constats`} de gravité 2`)
  else parts.push('Aucune difficulté de gravité 2 ou 3 déclarée')
  parts.push(deuxDiagnostics ? 'deux diagnostics complétés' : 'un seul diagnostic complété')
  parts.push(whatsapp ? 'contact joignable sur WhatsApp' : 'pas de numéro WhatsApp renseigné')
  return { niveau, justification: parts.join(', ') + '.' }
}

export interface Levier {
  id: string
  code: string
  nom: string
  icone: string
  description: string
  ordre: number
  actif: boolean
  dimensions: { dimension: string; role: 'traite' | 'support' }[]
}

export async function leviers(): Promise<Levier[]> {
  const { rows } = await db().query<Levier>(
    `select l.id, l.code, l.nom, l.icone, l.description, l.ordre, l.actif,
            coalesce(json_agg(json_build_object('dimension', c.dimension, 'role', c.role) order by c.role, c.dimension)
                     filter (where c.levier_id is not null), '[]') as dimensions
       from levier_feexpay l left join levier_constat c on c.levier_id = l.id
      group by l.id order by l.ordre, l.nom`,
  )
  return rows
}

/** Leviers rattachés aux constats retenus, ordonnés par gravité du constat traité (A05). */
export function leviersPourConstats(tous: Levier[], constats: Constat[]) {
  const out: { levier: Levier; traite: Constat[]; support: Constat[]; gravite: number }[] = []
  for (const l of tous.filter((x) => x.actif)) {
    const traite = constats.filter((c) => l.dimensions.some((d) => d.role === 'traite' && d.dimension === c.dimension))
    const support = constats.filter((c) => l.dimensions.some((d) => d.role === 'support' && d.dimension === c.dimension))
    if (!traite.length && !support.length) continue
    const gravite = Math.max(...traite.map((c) => c.gravite + 0.5), ...support.map((c) => c.gravite), 0)
    out.push({ levier: l, traite, support, gravite })
  }
  return out.sort((a, b) => b.gravite - a.gravite || a.levier.ordre - b.levier.ordre)
}

export interface ParticipationResumee {
  id: string
  identifiant: string
  diagnostic_type: 'dirigeant' | 'rayonnement'
  status: string
  version: string
  started_at: Date
  completed_at: Date | null
  duration_s: number | null
  session_id: string
}

/** Résultats calculés et constats d'un contact : dernière participation complète par diagnostic. */
export async function dossierContact(contactId: string) {
  const { rows: parts } = await db().query<ParticipationResumee & { items: InsightSnapshot | null }>(
    `select p.id, p.diagnostic_type, p.status, v.version, p.started_at, p.completed_at, p.duration_s, p.session_id,
            i.items
       from participation p
       join scoring_version v on v.id = p.version_id
       left join insight_snapshot i on i.participation_id = p.id
      where p.contact_id = $1
      order by p.started_at desc`,
    [contactId],
  )
  const derniere = (type: 'dirigeant' | 'rayonnement') => parts.find((p) => p.diagnostic_type === type && p.status === 'completed') ?? null
  const pDir = derniere('dirigeant')
  const pRay = derniere('rayonnement')

  const rDir = pDir ? scoreDirigeant((await engineAnswers(pDir.id)) as Answers, pDir.version) : null
  const answersRay = pRay ? ((await engineAnswers(pRay.id)) as Answers) : null
  const rRay = pRay && answersRay ? scoreRayonnement(answersRay, pRay.version) : null
  const croisement = rDir && rRay && rDir.version === rRay.version ? crossReading(rDir, rRay) : null
  const constats = constatsTries(pDir?.items ?? null, pRay?.items ?? null)

  return {
    participations: parts.map(({ items: _i, ...p }) => ({ ...p, identifiant: identifiantParticipation(p.id, p.started_at) })),
    dirigeant: rDir
      ? {
          participationId: pDir!.id,
          public: toPublicDirigeant(rDir),
          affinities: rDir.affinities,
          norm: rDir.norm,
          pilotage: rDir.pilotage,
          tieBreak: rDir.tieBreak,
          version: rDir.version,
          insights: pDir!.items,
        }
      : null,
    rayonnement: rRay
      ? { participationId: pRay!.id, public: toPublicRayonnement(rRay, answersRay!), version: rRay.version, insights: pRay!.items }
      : null,
    croisement: croisement
      ? {
          code: croisement.code,
          lecture: croisement.lecture,
          interpretation: croisement.interpretation,
          formulation: croisement.formulation,
          prioriteMarketing: croisement.prioriteMarketing,
          prioriteFeexpay: croisement.prioriteFeexpay,
          qualificatif: croisement.qualificatif,
          pilotage: Math.round(croisement.pilotage),
          rayonnement: Math.round(croisement.rayonnement),
          ecart: Math.round(croisement.ecart),
          version: rDir!.version,
        }
      : null,
    constats,
    forces: [...(pDir?.items?.forces ?? []), ...(pRay?.items?.forces ?? [])] as Force[],
    hypotheses: [...(pDir?.items?.hypotheses ?? []), ...(pRay?.items?.hypotheses ?? [])] as Hypothesis[],
  }
}

/** Journalise un export (CDC : chaque export est tracé avec son auteur, son périmètre et son motif). */
export async function journaliserExport(event: H3Event, scope: Record<string, unknown>, motif: string, rowCount: number) {
  const { audit } = await import('./admin-auth')
  const admin = event.context.admin as { user: { id: string } }
  const { rows } = await db().query<{ id: string }>(
    `insert into export_job (author_id, scope, motif, status, row_count, updated_at)
     values ($1, $2, $3, 'done', $4, now()) returning id`,
    [admin.user.id, JSON.stringify(scope), motif, rowCount],
  )
  await audit(event, 'export.create', 'export_job', rows[0]!.id, { motif, rowCount })
  return rows[0]!.id
}

/** Sortie CSV (UTF-8 avec BOM pour Excel, séparateur point-virgule). */
export function csv(lignes: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + lignes.map((l) => l.map(cell).join(';')).join('\r\n')
}
