# Recette technique — Radar by FeexPay

Deux passes : 9 septembre 2026 (recette initiale), puis **10 septembre 2026** après
fermeture des restes du lot 7. Avant la recette fonctionnelle du client et la mise en ligne
du vendredi 25 septembre 2026 sur `radar.feexpay.me`.

## 1. Contrôles automatisés (tous verts, passe du 10 septembre)

| Suite | Commande | Contrôles |
|---|---|---|
| Moteur de scoring (cas §5.5, huit archétypes, départage V2.1 et V2.2, constats, cas de contrôle T01) | `pnpm test` (packages/scoring) | 47 |
| Migrations SQL sur PGlite (tables, RLS deny-all, immutabilité, une seule version publiée, parenté des notifications) | `pnpm test` (racine) | 10 |
| Parcours public : session, réponses, reprise, abandon | `pnpm test:api` | 26 |
| Résultats : calcul, snapshot, idempotence, cas normatifs | `pnpm test:results` | 15 |
| Conversion : contact, consentement CMP01, rapport, email | `pnpm test:leads` | 10 |
| Admin auth : invitation, 2FA, RBAC, dernier admin | `pnpm test:admin` | 23 |
| Admin métier : dashboard, prospects, fiche, participation, leviers, exports | `pnpm test:metier` | 30 |
| Rapports et emails, webhook Resend, versions du moteur | `pnpm test:lot6` | 23 |
| Réinitialisation du mot de passe admin | `pnpm test:reset` | 23 |

Aucune intégration continue : le dépôt n'a pas de workflow GitHub Actions (décision du
9 septembre 2026, le déploiement passe par Vercel). Ces commandes sont donc à lancer en local
avant chaque livraison ; le tableau ci-dessus est l'état de la passe du 9 septembre.

Typecheck de l'application : aucune erreur (les deux erreurs restantes sont dans la
configuration Nuxt et le paquet moteur, connues et sans effet à l'exécution).
Build de production `nuxt build` : succès (10,7 Mo, 2,79 Mo compressés). Le bundle public
`.output/public` ne contient aucune des valeurs secrètes du `.env` — vérifié par recherche
des valeurs elles-mêmes, et non des seuls noms de variables, ces derniers apparaissant
légitimement dans le formulaire Réglages.

## 2. Contrôle visuel

Méthode : chaque écran est comparé au cadre HTML extrait de la maquette V1.2
(`docs/maquette/frames/`), aux largeurs 390, 834 et 1440. Admin à 1440.

| Écran | 390 | 834 | 1440 | Remarques |
|---|---|---|---|---|
| P01 accueil, C01/C02 cookies | ✓ | ✓ | ✓ | passe de fidélité du 8 septembre |
| P02 choix, P03/P05 introductions | ✓ | ✓ | ✓ | reprise « Reprendre à la question N » vérifiée |
| P04/P06 questions, P07 calcul | ✓ | ✓ | ✓ | rail de thèmes à 1440, modification d'une réponse signalée |
| P08/P09 résultats, P10 conversion (CMP01), P11 confirmation | ✓ | ✓ | ✓ | |
| P12 rapport, P13/P14 partage | ✓ | ✓ | ✓ | partage par jeton de rapport |
| L01/L02 politique et mentions | ✓ | ✓ | ✓ | textes provisoires en attente de l'Annexe 05 |
| Pages d'erreur (résultat expiré, rapport introuvable, adresse inconnue, panne) | ✓ | ✓ | ✓ | **corrigé en recette** : page à la charte à la place de la page Nuxt par défaut |
| A01 connexion et 2FA, A09 invitation, A10 comptes | | | ✓ | |
| A02 dashboard, A03 prospects, A04 fiche, A05 diagnostic commercial, A06 participation, A08 états | | | ✓ | |
| A07 rapports et emails, T01 versions, Réglages et Leviers FeexPay | | | ✓ | |

## 2 bis. Passe du 10 septembre — fermeture des restes du lot 7

| Point | Contrôle |
|---|---|
| En-têtes de sécurité | Servis par le build de production : HSTS (2 ans, sous-domaines, preload), CSP avec `frame-ancestors 'none'` et `object-src 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. `/` reste indexable, tout le reste `noindex`. Absents en développement, par nécessité (Vite exige `eval` et un WebSocket). |
| Tracking serveur | Parcours complet joué : `quiz_completed` et `Lead` acceptés par Meta CAPI, `report_generated` et `report_sent` journalisés avec la cause exacte de leur non-envoi (`ga4_api_secret` absent, cf. §5). Aucun doublon d'`event_id` dans `tracking_event_outbox`. |
| Abandon automatique | Session forcée à expiration : la participation en cours passe `abandoned`, une participation terminée reste intacte. Jeton absent → 403, jeton faux → 401. |
| Partage | Les quatre formats de l'énumération sont proposés ; la trace est écrite dans `share_asset`, une ligne par participation et par format. |
| Réinitialisation du mot de passe | 23 contrôles, dont l'absence d'énumération de comptes (réponse et message identiques pour une adresse connue et une inconnue, aucune demande créée dans le second cas), le jeton à usage unique, la coupure des sessions ouvertes et le refus d'un compte suspendu. |
| Politique de confidentialité sur P10 | Ouverture en fenêtre modale vérifiée au navigateur : titre annoncé, fermeture par Échap, focus rendu au déclencheur, défilement de la page rétabli. La saisie du formulaire est conservée. |
| Parcours hors ligne | Réponse mise en file locale quand le réseau manque, rejeu au retour, bannière affichée seulement si des réponses attendent réellement. La complétion refuse de partir tant que la file n'est pas vide. |
| Migrations | Deux nouvelles migrations appliquées sur le projet Supabase : réglage `ga4_api_secret`, table `admin_password_reset` et élargissement de la contrainte de parenté de `notification`. Un test vérifie que l'ancienne contrainte a bien été remplacée et non contournée. |

## 3. Écarts relevés et traitement

1. **Pages d'erreur** : la page 404/500 par défaut de Nuxt (anglaise, fond sombre) s'affichait
   sur un résultat expiré ou un rapport introuvable. Corrigé : `app/error.vue` à la charte,
   avec la cause et l'action qui débloque.
2. **Envoi d'emails** : tant que le domaine d'envoi n'est pas vérifié chez Resend, seul le
   titulaire du compte Resend reçoit les emails ; tout autre destinataire est refusé et
   apparaît en « Échec » dans A07. Levée par le dossier DNS (`docs/DNS_radar.feexpay.me.md`).
3. **Webhook Resend** : prêt, inactif tant que `RESEND_WEBHOOK_SECRET` est vide. À déclarer
   chez Resend après vérification du domaine ; sans lui, les statuts s'arrêtent à « Accepté ».
4. **Textes juridiques** : L01/L02 portent un texte provisoire marqué « en attente de
   validation ». Bloquant pour la mise en ligne, pas pour la recette fonctionnelle.
5. **Compte de test résiduel** : `test-admin-mtt3ombj@feexpay.me` reste actif en base
   (banni côté Supabase). À révoquer depuis A10 dès que `amedeel@feexpay.me` a accepté son
   invitation (le garde du dernier administrateur l'interdit avant).

## 4. Recette fonctionnelle du client — parcours à dérouler

Sur téléphone, tablette et ordinateur :

1. Accueil → « Commencer un diagnostic » → choisir Profil du dirigeant → 14 questions →
   résultat. Vérifier : retour arrière sans perte, fermeture puis réouverture du navigateur
   (reprise à la bonne question), bandeau cookies et « Gérer mes cookies » en pied de page.
2. Depuis le résultat, « Faire le second diagnostic » → 7 questions → résultat Rayonnement
   avec météo, puis lecture croisée.
3. « Recevoir mon analyse complète » → formulaire P10 (case obligatoire de traitement, case
   facultative de contact) → confirmation P11. **Le rapport se consulte d'abord depuis P11** :
   les trois boutons « Consulter mon rapport », « Télécharger le PDF » et « Partager » y mènent
   au rapport en ligne (P12), à son PDF et aux cartes P13/P14. L'email reçu porte le même lien,
   pour retrouver le rapport plus tard — c'est un second chemin, pas le seul.
4. Admin : connexion `amedeel@feexpay.me`, enrôlement 2FA, invitation des neuf autres
   comptes (A10 → Nouveau compte), attribution des rôles, réglages tracking, leviers FeexPay.
5. Admin : dashboard, liste des prospects (filtres, export CSV), fiche du contact créé à
   l'étape 3, diagnostic commercial, renvoi du rapport, journal A07, versions T01.

Les défauts sont à consigner avec l'écran, la largeur, l'appareil et le `correlation_id`
renvoyé par l'API en cas d'erreur (visible dans la réponse réseau).

## 5. Reste à faire avant le 25 septembre

- Point focal FeexPay : DNS `radar.feexpay.me` et enregistrements SPF/DKIM/DMARC (dossier
  `docs/DNS_radar.feexpay.me.md`), puis `RESEND_FROM` sur le domaine vérifié et
  `RESEND_WEBHOOK_SECRET`.
- Textes juridiques validés (Annexe 05) à insérer dans L01/L02.
- Variables de production sur l'hébergement : `APP_BASE_URL=https://radar.feexpay.me`,
  `TRACKING_ENABLED=true` (les identifiants GA4, Pixel et CAPI sont en base, modifiables
  dans Réglages), code d'événement de test Meta vidé après recette.
- Transfert du projet Supabase à l'organisation FeexPay (dashboard, sans changement de code),
  **et création d'un projet de production distinct** : le projet actuel sert à la fois de
  développement et de pré-production et contient des données de test.
- `CRON_SECRET` à poser côté hébergement, sans quoi la clôture quotidienne des parcours
  abandonnés refuse tout appel.
- **Secret d'API GA4** (Measurement Protocol) à saisir dans Réglages : sans lui,
  `report_generated` et `report_sent` ne remontent pas dans GA4. Les autres identifiants de
  tracking sont déjà en base.
- Révocation du compte de test `test-admin-mtt3ombj@feexpay.me` une fois `amedeel@feexpay.me`
  actif, et du compte `test-reset@feexpay.me` laissé révoqué par `pnpm test:reset`.
- Sauvegarde : confirmer le plan Supabase et **exécuter une restauration complète de bout en
  bout**, jamais faite à ce jour (procédure dans `docs/ARCHITECTURE.md` §8).

Restes de développement non bloquants, à arbitrer : ESLint/Prettier, logger structuré, et
l'e2e Playwright aux largeurs 390/834/1440 qu'exige le DoD du PLAN.md §12 — aujourd'hui
seuls des scripts HTTP couvrent l'API.
