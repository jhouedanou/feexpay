/**
 * Ouverture de la politique de confidentialité en fenêtre modale, sur le modèle de
 * `useConsent()`.
 *
 * Partout dans le produit, le lien vers la politique ouvre le texte par-dessus la page :
 * quitter l'écran en cours ferait perdre une saisie (P10) ou la place dans un parcours. La
 * page `/politique-de-confidentialite` reste en service — elle sert les liens des emails et
 * les accès directs.
 */
export function useConfidentialiteModale() {
  const ouverte = useState<boolean>('confidentialite-modale', () => false)
  const ouvrir = () => (ouverte.value = true)
  const fermer = () => (ouverte.value = false)
  return { ouverte, ouvrir, fermer }
}
