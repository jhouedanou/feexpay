import type { RapportPublic } from './report'
import { nomRapport } from './report'

/**
 * Modèles de l'email de rapport, modifiables depuis l'admin (A07).
 *
 * Trois modèles, un par forme de rapport : Dirigeant seul, Rayonnement seul, rapport croisé
 * complet. Chacun porte les mêmes champs de texte. Les valeurs d'origine vivent ici ; la table
 * `email_template` ne conserve que ce qu'un administrateur a réécrit, champ par champ.
 *
 * Les textes acceptent des variables entre doubles accolades, `{{prenom}}` par exemple, qui
 * sont remplacées à l'envoi. Une variable inconnue est effacée plutôt que laissée telle quelle
 * dans l'email d'un prospect.
 */
export type CleModele = 'dirigeant' | 'rayonnement' | 'croise'
export const CLES_MODELES: CleModele[] = ['dirigeant', 'rayonnement', 'croise']

export const CHAMPS_MODELE = ['sujet', 'titre', 'salutation', 'introduction', 'bouton', 'mention', 'pied'] as const
export type ChampModele = (typeof CHAMPS_MODELE)[number]
export type ChampsModele = Record<ChampModele, string>

export const DESCRIPTION_MODELES: Record<CleModele, { nom: string; detail: string }> = {
  dirigeant: { nom: 'Rapport Dirigeant', detail: '8 variantes d’archétype' },
  rayonnement: { nom: 'Rapport Rayonnement', detail: '5 niveaux' },
  croise: { nom: 'Rapport croisé complet', detail: '4 lectures croisées' },
}

/** Libellé et aide de chaque champ, pour l'éditeur. */
export const DESCRIPTION_CHAMPS: Record<ChampModele, { libelle: string; aide: string; long: boolean }> = {
  sujet: { libelle: 'Sujet de l’email', aide: 'Ce que le destinataire voit dans sa boîte de réception.', long: false },
  titre: { libelle: 'Titre du bandeau', aide: 'En blanc sur le bandeau bleu nuit, en haut de l’email.', long: false },
  salutation: { libelle: 'Salutation', aide: 'Première ligne du message.', long: false },
  introduction: { libelle: 'Introduction', aide: 'Le paragraphe qui précède le résumé des résultats. Le résumé lui-même est calculé et ne se modifie pas.', long: true },
  bouton: { libelle: 'Bouton', aide: 'Libellé du bouton orange qui ouvre le rapport en ligne.', long: false },
  mention: { libelle: 'Mention sous le bouton', aide: 'Texte gris sous le bouton, réservé à l’usage des données et au droit de suppression.', long: true },
  pied: { libelle: 'Pied de page', aide: 'Dernière ligne, en petit, sous le trait de séparation.', long: false },
}

export const VARIABLES_MODELE: { cle: string; description: string }[] = [
  { cle: 'prenom', description: 'Prénom du contact' },
  { cle: 'nom', description: 'Nom du contact' },
  { cle: 'entreprise', description: 'Entreprise du contact, vide si absente' },
  { cle: 'nomRapport', description: 'Nom du rapport, « Votre rapport Stratège complet »' },
  { cle: 'archetype', description: 'Archétype du dirigeant, vide sans diagnostic Dirigeant' },
  { cle: 'score', description: 'Score de rayonnement sur 100, vide sans diagnostic Rayonnement' },
  { cle: 'niveau', description: 'Niveau de rayonnement, « Challenger fort »' },
  { cle: 'lecture', description: 'Lecture croisée, vide sans rapport croisé' },
  { cle: 'lien', description: 'Adresse du rapport en ligne' },
]

const DEFAUT: ChampsModele = {
  sujet: '{{nomRapport}} — Radar by FeexPay',
  titre: '{{nomRapport}}',
  salutation: 'Bonjour {{prenom}},',
  introduction: 'Votre rapport est prêt. Il est joint à cet email au format PDF et reste consultable en ligne.',
  bouton: 'Consulter mon rapport',
  mention: 'Vos réponses servent à produire votre rapport, rien d’autre. Vous pouvez en demander la suppression à tout moment en écrivant à donnees@feexpay.me.',
  pied: 'Radar by FeexPay · Powered by FeexPay',
}

export const DEFAUTS_MODELES: Record<CleModele, ChampsModele> = {
  dirigeant: { ...DEFAUT },
  rayonnement: { ...DEFAUT },
  croise: { ...DEFAUT },
}

export function estCleModele(v: unknown): v is CleModele {
  return typeof v === 'string' && (CLES_MODELES as string[]).includes(v)
}

/** Modèle qui correspond à la forme d'un rapport. */
export function cleDuRapport(r: Pick<RapportPublic, 'dirigeant' | 'rayonnement' | 'croisement'>): CleModele {
  if (r.croisement) return 'croise'
  if (r.dirigeant) return 'dirigeant'
  return 'rayonnement'
}

/** Champs complets : les valeurs reçues quand ce sont des chaînes non vides, l'origine sinon. */
export function completerChamps(cle: CleModele, partiel: unknown): ChampsModele {
  const source = partiel && typeof partiel === 'object' ? (partiel as Record<string, unknown>) : {}
  const out = { ...DEFAUTS_MODELES[cle] }
  for (const champ of CHAMPS_MODELE) {
    const v = source[champ]
    if (typeof v === 'string' && v.trim()) out[champ] = v
  }
  return out
}

export interface ModeleCharge {
  cle: CleModele
  champs: ChampsModele
  /** Au moins un champ réécrit en base. */
  personnalise: boolean
  modifieLe: Date | null
  modifiePar: string | null
}

/** Modèle tel qu'il sera envoyé : les réécritures en base par-dessus l'origine. */
export async function chargerModele(cle: CleModele): Promise<ModeleCharge> {
  const { rows } = await db().query<{ champs: unknown; updated_at: Date; prenom: string | null; nom: string | null }>(
    `select t.champs, t.updated_at, a.prenom, a.nom
       from email_template t left join admin_user a on a.id = t.updated_by
      where t.cle = $1`,
    [cle],
  )
  const row = rows[0]
  if (!row) return { cle, champs: { ...DEFAUTS_MODELES[cle] }, personnalise: false, modifieLe: null, modifiePar: null }
  return {
    cle,
    champs: completerChamps(cle, row.champs),
    personnalise: true,
    modifieLe: row.updated_at,
    modifiePar: row.prenom ? `${row.prenom} ${row.nom ?? ''}`.trim() : null,
  }
}

/** Valeurs des variables pour un rapport donné. */
export function variablesDuRapport(r: RapportPublic, lien: string): Record<string, string> {
  return {
    prenom: r.contact.prenom,
    nom: r.contact.nom,
    entreprise: r.contact.entreprise ?? '',
    nomRapport: nomRapport(r),
    archetype: r.dirigeant?.archetype.code ?? '',
    score: r.rayonnement ? String(r.rayonnement.score) : '',
    niveau: r.rayonnement?.niveauAffiche ?? '',
    lecture: r.croisement?.lecture ?? '',
    lien,
  }
}

/** Remplace les `{{variables}}` ; une variable inconnue devient vide. */
export function rendreTexte(texte: string, variables: Record<string, string>): string {
  return texte.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (_, cle: string) => variables[cle] ?? '')
}
