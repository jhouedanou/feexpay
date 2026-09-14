RADAR BY FEEXPAY — PACK DE HANDOFF DÉVELOPPEMENT
Version 1.1 — 31 août 2026

Produit : Radar by FeexPay
Domaine cible : radar.feexpay.me
Rédaction : Cossi CODJIA — Chef de projet marketing
Suivi opérationnel : Morel KOUADIO — Chef de projet social media
Destinataire : Jean-Luc HOUÉDANOU, Directeur Solutions Digitales, et équipe de développement FeexPay
Statut : pack consolidé pour développement


1. OBJET DU PACK

Ce dossier regroupe les références fonctionnelles, techniques, visuelles, graphiques et de tracking nécessaires à l’estimation, au développement et à la recette de Radar by FeexPay.

La version 1.1 remplace le pack de handoff V1.0. Elle intègre les deux nouvelles maquettes UI, leurs dépendances, les huit emblèmes des archétypes, la nouvelle illustration du hero et le plan d’installation du tracking.


2. ORDRE DE LECTURE RECOMMANDÉ

1. CDC_Fonctionnel_Technique_Radar_by_FeexPay_V1.1.docx
   Référence fonctionnelle et technique générale.

2. Annexe_01_Matrice_scoring_Radar_by_FeexPay_V2.1_Normative.xlsx
   Source normative du scoring, des libellés, des règles combinées et des cas de contrôle.

3. Annexe_02_Maquettes_UI_Radar_by_FeexPay/
   Référence actuelle des interfaces, composants, états, formats responsive et liaisons entre écrans.

4. Annexe_04_Plan_Tracking_Radar_by_FeexPay_V1.0.docx
   Référence d’installation de GA4, du Meta Pixel et de la Meta Conversions API.

5. Annexe_03_Kit_graphique_Radar_by_FeexPay/
   Charte, logos, emblèmes et illustration du hero.

6. MANIFESTE_SHA256_Radar_by_FeexPay_V1.1.txt
   Empreintes de contrôle de tous les fichiers livrés, à l’exception du manifeste lui-même.


3. ORDRE DE PRÉVALENCE

En cas d’écart entre les documents :

1. Le cahier des charges V1.1 prévaut pour le périmètre, les règles fonctionnelles, les données, les droits, la sécurité, les API et les critères de recette.
2. La matrice V2.1 prévaut exclusivement pour le scoring, les questions, les options, les pondérations, les constats, les règles combinées et les contrôles normatifs.
3. Le plan de tracking V1.0 prévaut pour les noms d’événements, les déclencheurs, les paramètres, les plateformes destinataires, les secrets, la déduplication Pixel/CAPI et la recette du tracking.
4. Les deux maquettes de l’Annexe 02 prévalent pour la composition visuelle, les composants, les états d’interface, le responsive, les actifs visibles et les liaisons graphiques entre écrans.
5. Le kit graphique prévaut pour les fichiers de marque et les actifs livrés.

Une maquette ne modifie ni le scoring ni une règle métier du CDC. Un texte, un code ou une donnée d’exemple visible dans une maquette reste non normatif lorsqu’il contredit le CDC ou la matrice.


4. MAQUETTES UI À UTILISER

Les deux fichiers suivants sont les seules maquettes actuelles du pack :

- Annexe_02_Maquettes_UI_Radar_by_FeexPay/Radar by FeexPay - Maquette V1.dc.html
  Maquette principale haute fidélité : foundations, composants, parcours public mobile/tablette/desktop, administration et comptes administrateurs.

- Annexe_02_Maquettes_UI_Radar_by_FeexPay/Radar by FeexPay - Arborescence.dc.html
  Arborescence visuelle : liaisons entre les écrans publics, les écrans d’administration et les états transverses.

Les fichiers support.js, _ds/ et assets/ situés dans le même dossier sont des dépendances des maquettes. Ils doivent rester à leur emplacement relatif pour que les HTML se chargent correctement.

Pour la prévisualisation, servir le dossier Annexe_02_Maquettes_UI_Radar_by_FeexPay depuis un serveur HTTP local. L’ouverture directe en file:// peut limiter certaines ressources externes.

Les prototypes chargent Poppins et Material Design Icons depuis des CDN. L’équipe de développement choisit le mode de distribution adapté à la production, sans exposer de secret ni modifier le rendu validé.


5. MAQUETTE OBSOLÈTE

Le fichier ci-dessous appartenait au précédent pack et ne doit plus être utilisé :

- Annexe_02_Maquette_HTML_Radar_by_FeexPay_Version_finale.html

Il a été retiré de cette version afin d’éviter toute ambiguïté. Les anciens fichiers hero-diagnostic.jpg, hero-diagnostic.png et Illustration_hero_Radar_by_FeexPay.jpg ont également été retirés. La référence actuelle est l’illustration des huit archétypes en orbite.


6. ARBITRAGE P13 / P14

Le CDC V1.1 décrit P13 comme l’écran générique de carte partageable. La nouvelle maquette distingue deux variantes visuelles :

- P13 : carte partageable du profil dirigeant ;
- P14 : carte partageable du rayonnement de l’entreprise.

Pour cette livraison, P14 doit être traité comme la variante entreprise de la fonctionnalité de partage couverte par P13 dans le CDC, et non comme une nouvelle étape métier. Les routes et composants peuvent être factorisés, à condition de restituer les deux compositions visuelles prévues par la maquette. Toute évolution du nombre d’écrans normatifs devra faire l’objet d’une nouvelle version du CDC.


7. ACTIFS GRAPHIQUES ACTUELS

Les actifs sont disponibles à deux emplacements complémentaires :

- Annexe 02 / assets : copies utilisées par les maquettes HTML et conservées avec leurs noms techniques ;
- Annexe 03 : kit graphique organisé pour l’intégration et l’archivage.

Le dispositif comprend huit archétypes : Stratège, Visionnaire, Bâtisseur, Conquérant, Fédérateur, Résilient, Gestionnaire et Réformateur.

Chaque emblème existe en trois tailles :

- 64 px : petits repères, listes et composants compacts ;
- 256 px : résultats, cartes et interfaces courantes ;
- version source PNG : grands rendus et exports de partage.

L’illustration hero actuelle est hero-archetypes-orbit. L’ancien visuel montrant un dirigeant et un commerce est obsolète.


8. TRACKING À IMPLÉMENTER

Le plan de tracking fait partie intégrante du handoff. Il documente 14 événements Radar couvrant l’arrivée, le choix et la progression dans le diagnostic, le résultat, le partage, le formulaire, la création du prospect, les rapports, le second diagnostic et le clic de contact FeexPay.

Règles essentielles :

- GA4 reçoit les événements de parcours et de conversion définis dans le plan ;
- Meta Pixel reçoit uniquement les signaux média indiqués ;
- Meta CAPI confirme uniquement DiagnosticComplete et Lead côté serveur ;
- la déduplication Pixel/CAPI repose sur le même event_name et le même event_id ;
- aucun token, secret, texte libre, réponse brute ou valeur de réponse ne doit être exposé au navigateur ou envoyé aux plateformes publicitaires ;
- les placeholders doivent être remplacés séparément dans les environnements de test et de production ;
- la mise en production est conditionnée par la recette GA4 DebugView et Meta Test Events.


9. ARBITRAGE COMMERCIAL IMPORTANT

La solution ne recommande automatiquement aucun produit FeexPay. La fiche commerciale expose des faits, difficultés, preuves, hypothèses et questions de relance. Le choix d’une offre intervient après l’échange commercial.

Les correspondances produit éventuellement visibles dans une donnée d’exemple ne sont pas des exigences fonctionnelles.


10. RECETTE ET INTÉGRITÉ

Les cas de contrôle du scoring sont contenus dans l’onglet « Contrôles » de l’Annexe 01. Toute modification du scoring nécessite une nouvelle version publiée et immuable.

Avant développement, vérifier le manifeste SHA-256. Après intégration, exécuter la recette fonctionnelle, responsive, graphique et tracking prévue dans le CDC, la matrice et le plan de tracking.


11. ÉLÉMENTS EXCLUS DU PACK

Les dossiers de travail uploads/, refs/, la vignette .thumbnail et le fichier radar-standalone-src.html de la source de conception n’ont pas été intégrés. Ils contiennent des fichiers de construction, des doublons ou une version visuelle antérieure et ne constituent pas des références de développement.

