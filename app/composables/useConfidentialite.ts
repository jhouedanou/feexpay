/**
 * Contenu de référence de la politique de confidentialité (L01). Partagé par la page
 * `/politique-de-confidentialite` et par la fenêtre modale de P10, pour qu'une correction
 * de texte n'ait qu'un seul endroit où être faite.
 *
 * Texte provisoire de maquettage : la version validée par FeexPay (annexe 05) le remplacera
 * avant la mise en ligne.
 */

export const MAJ_CONFIDENTIALITE = '7 septembre 2026'

export const SOMMAIRE_CONFIDENTIALITE = [
  'Responsable du traitement',
  'Données collectées',
  'Finalités et bases légales',
  'Cookies et traceurs',
  'Modifier ou retirer votre choix',
  'Destinataires',
  'Durées de conservation',
  'Sécurité',
  'Vos droits',
  'Contact et réclamation',
]

export const FINALITES_CONFIDENTIALITE: [string, string][] = [
  ['Calculer et afficher votre diagnostic', 'Votre consentement'],
  ['Vous envoyer votre rapport par email', 'Votre consentement (case obligatoire)'],
  ['Vous contacter au sujet de nos services', 'Votre consentement (case facultative)'],
  ['Mesurer l’audience du service', 'Votre consentement aux cookies de mesure'],
  ['Mesurer nos campagnes publicitaires', 'Votre consentement publicitaire'],
  ['Sécurité du service et prévention des abus', 'Intérêt légitime de FeexPay'],
]

export const DUREES_CONFIDENTIALITE: [string, string][] = [
  ['Réponses et résultats du diagnostic', '24 mois'],
  ['Fiche prospect et échanges commerciaux', '36 mois après le dernier contact'],
  ['Mesure d’audience', '14 mois'],
  ['Preuve du consentement', '5 ans'],
  ['Journaux de sécurité', '12 mois'],
]
