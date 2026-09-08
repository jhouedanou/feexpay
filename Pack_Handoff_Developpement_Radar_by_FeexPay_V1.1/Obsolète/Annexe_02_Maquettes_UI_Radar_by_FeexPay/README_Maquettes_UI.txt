RADAR BY FEEXPAY — NOTICE DES MAQUETTES UI
Version 1.1 — 31 août 2026

1. FICHIERS AUTORITATIFS

- Radar by FeexPay - Maquette V1.dc.html
  Référence visuelle principale : foundations, composants, écrans publics, responsive, administration et comptes administrateurs.

- Radar by FeexPay - Arborescence.dc.html
  Référence des liaisons visuelles entre écrans et des états transverses.

L’ancienne maquette HTML du pack V1.0 est obsolète et n’est pas incluse.

2. DÉPENDANCES À CONSERVER

Les deux HTML utilisent des chemins relatifs vers :

- support.js ;
- _ds/ ;
- assets/.

Ne pas déplacer un HTML sans ses dépendances. Servir ce dossier depuis un serveur HTTP local pour le contrôle visuel.

3. ACTIFS COURANTS

Le dossier assets/ contient :

- les logos utilisés par les écrans ;
- les huit emblèmes en 64 px, 256 px et version source ;
- l’illustration hero-archetypes-orbit en version source et 1040 px.

Les anciens actifs hero-diagnostic ont été exclus de cette livraison.

4. RESPONSIVE

Les références de contrôle sont :

- mobile : 390 px ;
- tablette : 834 px ;
- desktop public : 1440 px ;
- administration : desktop selon les frames de la maquette.

La réalisation responsive doit adapter les compositions et les hiérarchies. Elle ne doit pas se limiter à réduire proportionnellement les écrans desktop.

5. POINT DE VIGILANCE P13 / P14

La maquette sépare la carte du profil dirigeant en P13 et la carte du rayonnement de l’entreprise en P14. Le CDC V1.1 couvre encore la fonctionnalité sous le code générique P13. Pour cette livraison, P14 est une variante visuelle de P13 ; le CDC reste prioritaire pour le périmètre métier.

6. RÈGLES D’ARBITRAGE

- CDC V1.1 : règles fonctionnelles et techniques ;
- matrice V2.1 : scoring et contenus normatifs ;
- plan de tracking V1.0 : instrumentation ;
- maquette principale : UI, composants, états et responsive ;
- arborescence : liaisons graphiques entre écrans ;
- kit graphique : fichiers de marque.

Les HTML constituent une spécification visuelle. Ils ne sont pas destinés à être copiés tels quels en production sans intégration dans l’architecture technique retenue.

