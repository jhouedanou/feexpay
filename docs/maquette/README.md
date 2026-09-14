# Maquette normative — extraction par écran

Généré par `node scripts/extract-maquette.mjs` depuis
`MarketingBS/Annexe_02_…/Radar by FeexPay - Maquette V1.dc.html`.

Le dossier `frames/` contient, en plus, chaque cadre d’écran en page HTML autonome
(markup complet : icônes, fonds, puces), généré par `node scripts/extract-maquette-frames.mjs`
et servi depuis la racine du projet pour le contrôle visuel. C’est la référence à ouvrir
à côté de l’application : l’extraction texte ci-dessous ne suffit pas pour la fidélité.

**Les fiches `.md` sont incomplètes par construction** : elles ne reprennent que les blocs de
texte. Les boutons portant une icône, les actions et les fonds n'y figurent pas. Le cas de P11
l'a montré en recette — sa fiche s'arrête sur « les trois actions restent distinctes » sans
jamais nommer les trois boutons, qui figurent bien dans le cadre HTML. **En cas de doute, c'est
`frames/` qui fait foi**, jamais l'extraction texte.

Les textes sont repris **sans modification**. Les commentaires HTML en fin de ligne
portent la spécification de police du bloc d’origine (graisse, taille, interligne, couleur),
qui donne la hiérarchie à respecter.

- [P01 · Landing](mobile-390-P01.md) — mobile-390, 31 blocs
- [P02 · Sélection du diagnostic](mobile-390-P02.md) — mobile-390, 24 blocs
- [P03 · Introduction Dirigeant](mobile-390-P03.md) — mobile-390, 8 blocs
- [P04 · Questions Dirigeant](mobile-390-P04.md) — mobile-390, 10 blocs
- [P05 · Introduction Rayonnement](mobile-390-P05.md) — mobile-390, 8 blocs
- [P06 · Questions Rayonnement](mobile-390-P06.md) — mobile-390, 11 blocs
- [P07 · Calcul](mobile-390-P07.md) — mobile-390, 4 blocs
- [P08 · Résultat Dirigeant](mobile-390-P08.md) — mobile-390, 33 blocs
- [P09 · Résultat Rayonnement](mobile-390-P09.md) — mobile-390, 22 blocs
- [P10 · Formulaire prospect](mobile-390-P10.md) — mobile-390, 39 blocs
- [P11 · Confirmation](mobile-390-P11.md) — mobile-390, 9 blocs
- [P12 · Rapport détaillé](mobile-390-P12.md) — mobile-390, 31 blocs
- [P13 · Carte partageable](mobile-390-P13.md) — mobile-390, 11 blocs
- [P14 · Carte partageable entreprise](mobile-390-P14.md) — mobile-390, 13 blocs
- [P01 · Landing · tablette](tablette-834-P01.md) — tablette-834, 34 blocs
- [P02 · Sélection du diagnostic · tablette](tablette-834-P02.md) — tablette-834, 24 blocs
- [P04 · Questions Dirigeant · tablette](tablette-834-P04.md) — tablette-834, 11 blocs
- [P08 · Résultat Dirigeant · tablette](tablette-834-P08.md) — tablette-834, 32 blocs
- [P01 · Landing · desktop](desktop-1440-P01.md) — desktop-1440, 55 blocs
- [P02 · Choix du diagnostic · desktop](desktop-1440-P02.md) — desktop-1440, 24 blocs
- [P03 · Introduction Dirigeant · desktop](desktop-1440-P03.md) — desktop-1440, 29 blocs
- [P04 · Questions Dirigeant · desktop](desktop-1440-P04.md) — desktop-1440, 21 blocs
- [P05 · Introduction Rayonnement · desktop](desktop-1440-P05.md) — desktop-1440, 21 blocs
- [P06 · Question Rayonnement · desktop](desktop-1440-P06.md) — desktop-1440, 22 blocs
- [P07 · Calcul du résultat · desktop](desktop-1440-P07.md) — desktop-1440, 7 blocs
- [P08 · Résultat Dirigeant · desktop](desktop-1440-P08.md) — desktop-1440, 35 blocs
- [P09 · Résultat Rayonnement · desktop](desktop-1440-P09.md) — desktop-1440, 30 blocs
- [P10 · Formulaire prospect · desktop](desktop-1440-P10.md) — desktop-1440, 50 blocs
- [P11 · Confirmation · desktop](desktop-1440-P11.md) — desktop-1440, 10 blocs
- [P12 · Rapport détaillé · desktop](desktop-1440-P12.md) — desktop-1440, 39 blocs
- [P13 · Carte partageable · desktop](desktop-1440-P13.md) — desktop-1440, 20 blocs
- [P14 · Carte partageable entreprise · desktop](desktop-1440-P14.md) — desktop-1440, 24 blocs
- [A01 · Connexion](admin-1440-A01.md) — admin-1440, 14 blocs
- [A02 · Dashboard](admin-1440-A02.md) — admin-1440, 93 blocs
- [A03 · Liste des prospects](admin-1440-A03.md) — admin-1440, 78 blocs
- [A04 · Fiche prospect · synthèse](admin-1440-A04.md) — admin-1440, 74 blocs
- [A05 · Fiche prospect · diagnostic commercial](admin-1440-A05.md) — admin-1440, 64 blocs
- [A06 · Détail d’une participation](admin-1440-A06.md) — admin-1440, 61 blocs
- [A07 · Rapports et emails](admin-1440-A07.md) — admin-1440, 72 blocs
- [A08 · États vides et erreurs](admin-1440-A08.md) — admin-1440, 22 blocs
- [A09 · Création d’un compte admin](comptes-admin-A09.md) — comptes-admin, 57 blocs
- [A10 · Gestion et administration des profils admins](comptes-admin-A10.md) — comptes-admin, 85 blocs
