# Registre des manquements — Radar by FeexPay

Écarts entre le pack de handoff V1.1 et ce qui est nécessaire pour livrer le produit décrit par le CDC.

Une ligne par manquement. Chaque ligne cite sa preuve sous la forme `fichier:ligne` pour qu'aucun point ne soit contestable sans ouvrir le fichier. Un manquement se ferme en passant son statut à **résolu**, dans le commit qui le corrige.

Ordre de prévalence appliqué (PLAN.md) : **CDC > matrice > plan tracking > maquettes > kit graphique**.

- Dernière mise à jour : 2026-09-08
- Périmètre vérifié : Lots 0–2 livrés et consolidés (runner de tests réparé, moteur pleinement câblé, libellés servis par l'API, projections typées de bout en bout). Lot 3 non commencé.
- État des tests : **47/47 verts** (28 moteur + 19 PGlite), `pnpm test` réparé

## Sommaire

1. [À trancher par le client](#1-à-trancher-par-le-client) — 11 points, dont 6 non listés dans le CDC
2. [Bugs](#2-bugs) — 3 points, 1 résolu
3. [Données du moteur](#3-données-du-moteur) — 1 point, résolu
4. [Câblage du moteur](#4-câblage-du-moteur) — 6 points, 5 résolus
5. [Schéma et API](#5-schéma-et-api) — 8 points
6. [Écrans](#6-écrans) — 7 points
7. [Dépendances et modules](#7-dépendances-et-modules) — 7 points
8. [Exploitation](#8-exploitation) — 11 points
9. [Écarts assumés vs CDC / PLAN](#9-écarts-assumés-vs-cdc--plan) — 4 points

---

## 1. À trancher par le client

Rien ici ne peut être décidé par l'équipe de développement. Les six lignes `CNS-` ne figurent dans aucun document du pack : elles ont été découvertes en confrontant la maquette au CDC.

| ID | Énoncé | Preuve | Impact | Bloque | Décideur | Défaut appliqué |
|---|---|---|---|---|---|---|
| `DAT-A2` | `TDR_Radar_by_FeexPay_V1_Valide.docx` absent du pack. Il porte la règle de départage détaillée des archétypes ; la cellule qui la résume n'est pas programmable telle quelle (« nombre de +2 » sur la dimension centrale ou sur les trois ? secondaire avant ou après arrondi ?). Le Simulateur de la matrice ne l'applique pas — il prend le premier de la liste. | Cité en « Vue d'ensemble » B24 du xlsx ; règle en « Archétypes & règles » B31, ordre technique B32 | ≈ 1 égalité sur 600 départagée arbitrairement | Clôture du Lot 2 | Cossi CODJIA | Dimension centrale, après arrondi. Trace complète stockée dans `score_snapshot.tie_break` |
| `CNS-01` | Politique de confidentialité : **libellé de lien uniquement**, aucun écran maquetté, aucun contenu rédigé | Maquette l.680, 1213, 1467, 1489 ; absente de l'Arborescence | Case de consentement obligatoire de P10 pointe vers une page inexistante | Lot 3 (P10) | Client | Page publique servie depuis un contenu versionné, texte à fournir |
| `CNS-02` | Mentions légales : **libellé de lien uniquement**, aucun écran, aucun contenu | Maquette l.681, 1221 ; absente de l'Arborescence | Lien mort en pied de page | Mise en production | Client | Idem `CNS-01` |
| `CNS-03` | **Gestion du consentement aux cookies totalement absente.** Zéro occurrence de `cookie`, `consentement`, `RGPD`, `CMP`, `traceur`, `tout accepter`, `gérer mes choix` dans la maquette. Le CDC ne cite « cookie » que deux fois, et pour la sécurité du cookie de session. Le plan tracking : rien. | Maquette : 0 occurrence. CDC l.1081 et l.1538 (cookie de session `HttpOnly/Secure/SameSite`). Annexe 04 : 0 occurrence | Aucun dépôt de GA4 ni de Meta Pixel n'est licite sans recueil préalable | Lot 7, mise en production | Client | Bandeau minimal + Consent Mode v2, tracking coupé tant que refus. Sans objet tant que `TRACKING_ENABLED=false` |
| `CNS-04` | **Les deux pieds de page de la maquette se contredisent.** Variante mobile : « Politique de confidentialité · Mentions légales · Nous écrire ». Variante desktop : « Cadre → Politique de confidentialité · Conditions générales d'utilisation ». Trois documents nommés au total, aucun pied ne les liste tous, aucun n'a d'écran. | Maquette l.680-682 vs l.1489-1490 | Périmètre éditorial indéterminé : deux ou trois documents ? | Lot 3 | Client | Trois documents prévus : confidentialité, mentions légales, CGU |
| `CNS-05` | La maquette impose **deux cases** dans le formulaire P10 — une obligatoire « J'ai lu et j'accepte la politique de confidentialité. \* » et une facultative, explicitement indépendante de la remise du rapport, « Je souhaite recevoir les prochaines analyses FeexPay ». **Ni le CDC, ni PLAN §7, ni le schéma SQL ne les prévoient** : PLAN §7 P10 ne décrit que « 7 champs », et la table `contact` n'a aucune colonne de consentement. | Maquette l.533, 990, 1953 ; `supabase/migrations/20260905000000_init.sql:136-154` | Consentement non horodaté, non versionné, donc non opposable | Lot 3 (P10) | Client pour le texte, équipe pour le schéma | 4 colonnes ajoutées à `contact` : `consent_privacy_at`, `consent_privacy_version`, `marketing_opt_in`, `marketing_opt_in_at` |
| `CNS-06` | **Aucun emplacement pour saisir ces contenus.** Les écrans référencés dans la maquette sont `P01`–`P14` et `A01`–`A10`, rien d'autre — le `T01` de PLAN §7 n'est lui-même pas maquetté. Pas d'écran public légal, pas d'écran d'administration de contenu. | Maquette et Arborescence : aucun code d'écran hors `P01`–`P14` / `A01`–`A10` | Les textes légaux n'ont nulle part où vivre | Lot 3 | Client (arbitrage périmètre) | Table `editorial_document` à versions immuables + écran `A11 · Contenus légaux`. Repli moins coûteux : trois fichiers markdown commités, écran admin repoussé au Lot 6 |
| `TRK-01` | Identifiants GA4 et Meta absents : measurement ID, API secret, Pixel ID, token CAPI, code de test | PLAN §10b item 4 ; `.env` renseigné avec des valeurs de 2 caractères | Aucun des 14 événements ne peut être recetté | Lot 7 | Morel KOUADIO | `TRACKING_ENABLED=false` ; les événements s'accumulent dans `tracking_event_outbox` avec `sent_at is null` |
| `OPS-DNS` | Accès DNS `feexpay.me` ou délégation de `radar.feexpay.me` (TLS, SPF/DKIM/DMARC) | PLAN §10b item 1 | Envoi d'emails limité au propriétaire du compte Resend | Lot 3 (emails), mise en production | Client via chef de projet | Expéditeur `onboarding@resend.dev` + liste blanche de destinataires ; tout destinataire hors liste passe `cancelled` |
| `OPS-HOST` | Frais d'hébergement à la charge de qui, et titulaire des comptes Supabase / Resend / hébergeur | PLAN §10b item 2 | Comptes ouverts à titre personnel par le développeur | Reprise du projet par le client | Chef de projet / contrat | Comptes personnels de Jean-Luc, à transférer |
| `OPS-ADMIN` | Adresse `@feexpay.me` du premier administrateur et liste des invités (nom, email, rôle) | PLAN §10b item 3 | Aucun compte admin ne peut être semé | Lot 4 | Client | — |

## 2. Bugs

| ID | Énoncé | Preuve | Gravité | Statut |
|---|---|---|---|---|
| `BUG-01` | **`pnpm test` échouait alors que les 44 tests passaient.** `packages/scoring` n'avait pas de `vitest.config.ts` : vitest remontait au config de la racine et cherchait son `globalSetup` PGlite dans `packages/scoring/test/`, d'où `ERR_LOAD_URL` et l'arrêt de la chaîne au premier maillon. La CI ne validait donc rien. | `vitest.config.ts:7` (racine) vs absence dans `packages/scoring/` | Élevée — aucune régression n'était détectable | **résolu** : `packages/scoring/vitest.config.ts` |
| `BUG-02` | `POST .../complete` renvoie un `randomUUID()` neuf sur son chemin idempotent. Deux appels produisent deux `event_id` pour un seul événement métier, ce qui détruit la déduplication Pixel ↔ CAPI que la contrainte `tracking_event_outbox.event_id unique` existe précisément pour garantir. Une conversion serait comptée deux fois. | `server/api/public/participations/[token]/complete.post.ts:15` | Élevée — fausse les conversions remontées à Meta et GA4 | ouvert |
| `BUG-03` | `freshDb()` lit **un** chemin de migration codé en dur. Toute migration ajoutée après la première serait invisible aux tests : la suite resterait verte contre un schéma périmé. | `test/pglite.ts:12` | Élevée — la première migration du Lot 3 rend les tests mensongers | ouvert |

## 3. Données du moteur

Vérification faite option par option contre le xlsx normatif V2.1 (`sha256 45137916…`). **Aucun trou** : 21 questions, 84 options, 9 champs de constat sur 84 options, 16 règles combinées avec signaux / hypothèse / relance, 8 archétypes complets, 8 dimensions, tous les niveaux, météo et qualificatifs d'écart. Les 40 `difficulte` vides correspondent exactement aux 40 options de gravité 0. L'onglet « Contrôles » n'est pas extrait mais est intégralement couvert par `controls.test.ts`. Les onglets « Vue d'ensemble », « Simulateur » et « Fiche prospect » ne portent aucune donnée normative — leurs colonnes « Rang difficulté / force » sont des sorties calculées.

| ID | Énoncé | Preuve | Statut |
|---|---|---|---|
| `DAT-A1` | **Libellés d'affichage des 5 dimensions de rayonnement absents du moteur.** `constants.json` ne porte que les clés de pondération (`notoriete`, `lectureConcurrentielle`, `differenciation`, `digital`, `empreinte`). Les libellés n'existent aujourd'hui que dans une constante codée en dur du front. | `packages/scoring/src/versions/v2.1/constants.json` ; `app/components/radar/DimensionBars.vue:2-7` | **résolu** : `RAYONNEMENT_DIMS` dans `packages/scoring/src/data.ts` |

> Correctif prévu : constante `RAYONNEMENT_DIMS` dans le **code source** de `data.ts`, jamais dans le JSON checksummé — le régénérer changerait `CHECKSUM` et ferait lever la garde de `server/db/seed.ts:14` sur la base en ligne, ce que les tests PGlite (qui resèment à neuf) ne détecteraient pas.

## 4. Câblage du moteur

| ID | Énoncé | Preuve | Statut |
|---|---|---|---|
| `WIR-01` | `dimensions.json` est généré par l'extracteur et compté dans le checksum, mais importé par personne et exporté nulle part | `packages/scoring/src/data.ts:1-6`, `src/index.ts:2` | **résolu** : `dimensions` exporté |
| `WIR-02` | `crossReading` : implémenté, testé, table SQL dédiée — **zéro appelant** hors du fichier de test. La lecture croisée, qui est une promesse produit de la landing, n'est produite nulle part | `packages/scoring/src/cross.ts:4` | ouvert |
| `WIR-03` | `publicDirigeant` et `fullPair` sont du code mort | `packages/scoring/src/index.ts:14,20` | **résolu** : supprimés |
| `WIR-04` | Libellés des dimensions dirigeant codés en dur dans le front, en doublon du vocabulaire du moteur, avec repli silencieux | `app/components/radar/DimensionBars.vue:2-7,15` | **résolu** : libellés servis par l'API |
| `WIR-05` | Icônes météo indexées sur des libellés français plutôt que sur un code stable, avec repli sur chaîne vide | `app/components/radar/WeatherCard.vue:2,8` | **résolu** : indexé sur `meteoCode` |
| `WIR-06` | Nombres de questions (14 et 7) codés en dur alors que l'API les sert déjà | `app/pages/diagnostic/[type]/introduction.vue:9-11`, `app/pages/diagnostic/index.vue:3-4` | **résolu** : dérivés de l'API |

> **Contrainte à respecter en corrigeant `WIR-04` et `WIR-05`** : `app/` ne doit jamais importer `@radar/scoring`. `data.ts:19` construit son index au niveau module, ce qui embarquerait `options.json` — donc les champs `constat.difficulte`, `hypothese` et `relance`, contenu commercial interne — dans le bundle client. Aujourd'hui `grep -rn "@radar/scoring" app/` est vide. Les libellés doivent transiter par l'API.

## 5. Schéma et API

| ID | Énoncé | Preuve | Statut |
|---|---|---|---|
| `SCH-01` | Le miroir Drizzle ne déclare que 9 des 21 tables du SQL. Manquent pour le Lot 3 : `contact`, `cross_reading`, `report`, `share_asset`, `notification`, `tracking_event_outbox`. Manquent pour la suite : `answer_history`, `admin_user`, `admin_recovery_code`, `admin_invitation`, `audit_log`, `export_job` | `server/db/schema.ts` vs `supabase/migrations/20260905000000_init.sql` | ouvert |
| `SCH-02` | `participation.contactId` et `parentParticipationId` sont déclarés sans `.references()`, faute de table miroir — alors que le SQL déclare bien les clés étrangères | `server/db/schema.ts:66,71` vs SQL l.162 | ouvert |
| `API-01` | `POST /api/public/leads` absent | PLAN §6 | ouvert |
| `API-02` | `GET /api/public/reports/{token}` absent | PLAN §6 | ouvert |
| `API-03` | `POST /api/public/reports/{token}/pdf` absent | PLAN §6 | ouvert |
| `API-04` | `POST /api/public/shares/{token}` absent | PLAN §6 | ouvert |
| `API-05` | `POST /api/public/track` absent | PLAN §6 | ouvert |
| `API-06` | `POST /api/webhooks/resend` absent — sans lui, aucun statut de délivrance ne remonte | PLAN §9 lot 3.13 | ouvert |

## 6. Écrans

| ID | Énoncé | Preuve | Statut |
|---|---|---|---|
| `UI-01` | P10 `/recevoir-mon-analyse/{token}` absente. **Le lien existe déjà et est mort** | `app/pages/resultat/[type]/[token].vue:54` | ouvert |
| `UI-02` | P11 `/confirmation/{token}` absente | PLAN §7 | ouvert |
| `UI-03` | P12 `/rapport/{token}` et sa variante `/print` absentes | PLAN §7 | ouvert |
| `UI-04` | P13/P14 `/partage/{token}` absentes | PLAN §7 | ouvert |
| `UI-05` | `/mentions-legales` et `/confidentialite` absentes. **Les deux liens existent déjà et sont morts** | `app/layouts/default.vue:18-19` | ouvert |
| `UI-06` | 404 public, page « lien expiré ou révoqué », page hors-ligne — absentes des maquettes et du CDC | PLAN §7, note finale | ouvert |
| `UI-07` | Composants `StepMeta`, `Skeleton`, `ScoreGauge` et file d'attente hors-ligne des réponses — annoncés, non réalisés | PLAN §9 items 10 et 11 | ouvert |

## 7. Dépendances et modules

| ID | Énoncé | Preuve | Statut |
|---|---|---|---|
| `DEP-01` | `@supabase/supabase-js` déclaré en dépendance, **zéro import** | `package.json:24` | ouvert |
| `DEP-02` | `pino` déclaré en dépendance, **zéro import** — aucune journalisation structurée alors que le CDC l'exige | `package.json:28`, PLAN §9 lot 0.4 | ouvert |
| `DEP-03` | `runtimeConfig.supabaseServiceKey` déclaré, lu par personne | `nuxt.config.ts:24` | ouvert |
| `DEP-04` | Code d'erreur `REPORT_PENDING` (HTTP 202) déclaré, jamais levé | `server/utils/errors.ts:9,20` | ouvert |
| `DEP-05` | `ga4MeasurementId`, `metaPixelId`, `trackingEnabled` déclarés, aucun lecteur | `nuxt.config.ts:31` | ouvert |
| `DEP-06` | pg-boss n'existe que sous forme de commentaire SQL | `supabase/migrations/20260905000000_init.sql:462` | ouvert |
| `DEP-07` | Non installés : `resend`, `pg-boss`, moteur de rendu PDF, moteur de rendu des cartes de partage | `package.json` | ouvert |

## 8. Exploitation

| ID | Énoncé | Preuve | Gravité | Statut |
|---|---|---|---|---|
| `OPS-ENV-1` | **Les deux clés Supabase sont interverties dans `.env`.** `SUPABASE_KEY` contient une clé `sb_secret_…`, `SUPABASE_SERVICE_KEY` contient une clé `sb_publishable_…`. Or `SUPABASE_KEY` est documentée comme la clé anon destinée au client : le premier code qui l'exposera au bundle publiera la clé service-role à tous les navigateurs | `.env.example:3-4` vs contenu de `.env` | **Critique** | ouvert |
| `OPS-ENV-2` | `DATABASE_URL` n'est pas une URL mais un nom d'hôte seul. postgres-js et pg-boss attendent `postgresql://postgres:<mdp>@db.<ref>.supabase.co:5432/postgres`, en connexion **directe** port 5432 et non le pooler — pg-boss a besoin du mode session | `.env` | Élevée | ouvert |
| `OPS-01` | `docs/ARCHITECTURE.md` absent — livrable H.2 n°2, explicitement exigé par le CDC F.1 (« choix consignés dans la documentation d'architecture ») | PLAN §9 lot 0.6 | Élevée — livrable contractuel | ouvert |
| `OPS-02` | `openapi.json` non généré alors que `nitro.experimental.openAPI` est activé | `nuxt.config.ts:36` | Moyenne | ouvert |
| `OPS-03` | En-têtes de sécurité HSTS et CSP absents | PLAN §9 lot 0.4, CDC l.1538 | Élevée | ouvert |
| `OPS-04` | Ni ESLint ni Prettier ni tests end-to-end Playwright | PLAN §9 lot 0.1 | Moyenne | ouvert |
| `OPS-05` | Poppins non auto-hébergée, sous-ensemble MDI non constitué. **Devient bloquant** dès les cartes de partage : le moteur de rendu exige une police embarquée, à défaut les cartes sortent dans une police de repli — défaut de marque sur l'artefact le plus partagé du produit | PLAN §9 lot 0.5 | Élevée | ouvert |
| `OPS-06` | Seed du premier compte administrateur non écrit | PLAN §9 lot 0.3 | Moyenne | ouvert |
| `OPS-07` | Tâche planifiée d'abandon des participations non écrite | PLAN §9 lot 1.9 | Faible | ouvert |
| `OPS-08` | Contrôle visuel des écrans à 390 / 834 / 1440 px contre les maquettes non effectué | PLAN §9 lot 1.10 | Moyenne | ouvert |
| `OPS-09` | Politique de sauvegarde et procédure de restauration non définies ni testées (RPO/RTO) | PLAN §9 lot 0.6 et lot 7.18 | Élevée | ouvert |

## 9. Écarts assumés vs CDC / PLAN

Décidés par l'équipe, à valider. Chacun s'écarte d'un choix inscrit dans PLAN §2.

| ID | Écart | Motif | Conséquence |
|---|---|---|---|
| `EXT-01` | Hébergement **serverless** au lieu du conteneur long-running recommandé | Choix de Jean-Luc | Ni le moteur PDF ni pg-boss ne survivent au serverless. Un second déploiement devient obligatoire : un conteneur toujours actif exécutant uniquement les jobs, contre le même Postgres. Les jobs sont donc écrits comme fonctions pures |
| `EXT-02` | Templates email en **HTML pur** au lieu de vue-email | Le worker n'a pas de runtime Vue SSR | Templates testables sans moteur de rendu ; PLAN §2 à corriger |
| `EXT-03` | Cartes de partage rendues par **satori appelé directement** au lieu de nuxt-og-image | Rend la fonction de rendu pure et appelable depuis le worker ; les 4 formats sont de toute façon sur mesure | Promeut `OPS-05` (Poppins) de confort à bloquant ; PLAN §2 à corriger |
| `EXT-04` | Écran `A11 · Contenus légaux` traité en Lot 3 alors qu'il relève du Lot 6 | Sans lui, la case de consentement obligatoire de P10 pointe vers une page inexistante — un formulaire qui fait accepter un texte qui n'existe pas n'est pas défendable | Élargit le Lot 3. Repli possible : textes en fichiers markdown commités, écran admin repoussé, schéma de consentement inchangé |
