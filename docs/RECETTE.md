# Recette technique — Radar by FeexPay

Passe du 9 septembre 2026, avant la recette fonctionnelle du client et la mise en ligne du
vendredi 25 septembre 2026 sur `radar.feexpay.me`.

## 1. Contrôles automatisés (tous verts)

| Suite | Commande | Contrôles |
|---|---|---|
| Moteur de scoring (cas §5.5, huit archétypes, départage V2.1 et V2.2, constats, cas de contrôle T01) | `pnpm test` (packages/scoring) | 47 |
| Migrations SQL sur PGlite (tables, RLS deny-all, immutabilité, une seule version publiée) | `pnpm test` (racine) | 9 |
| Parcours public : session, réponses, reprise, abandon | `pnpm test:api` | 26 |
| Résultats : calcul, snapshot, idempotence, cas normatifs | `pnpm test:results` | 14 |
| Conversion : contact, consentement CMP01, rapport, email | `pnpm test:leads` | — |
| Admin auth : invitation, 2FA, RBAC, dernier admin | `pnpm test:admin` | 22 |
| Admin métier : dashboard, prospects, fiche, participation, leviers, exports | `pnpm test:metier` | 30 |
| Rapports et emails, webhook Resend, versions du moteur | `pnpm test:lot6` | 24 |

Aucune intégration continue : le dépôt n'a pas de workflow GitHub Actions (décision du
9 septembre 2026, le déploiement passe par Vercel). Ces commandes sont donc à lancer en local
avant chaque livraison ; le tableau ci-dessus est l'état de la passe du 9 septembre.

Typecheck de l'application : aucune erreur (les deux erreurs restantes sont dans la
configuration Nuxt et le paquet moteur, connues et sans effet à l'exécution).
Build de production `nuxt build` : succès. Le bundle public `.output/public` ne contient ni
clé service Supabase, ni URL de base de données, ni jeton.

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
   facultative de contact) → confirmation → email reçu avec PDF joint → lien « Consulter mon
   rapport » → P12 → « Partager » → cartes P13/P14.
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
- Transfert du projet Supabase à l'organisation FeexPay (dashboard, sans changement de code).
