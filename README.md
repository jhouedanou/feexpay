# Radar by FeexPay

Web app mobile-first : profil du dirigeant (14 questions → 8 archétypes) et rayonnement de
l'entreprise (7 questions → score 0–100, niveau et météo). Résultat affiché **avant tout
formulaire**. Plan complet et décisions : [PLAN.md](PLAN.md). Sources normatives : `MarketingBS/`.

## Stack

Nuxt 4 (monolithe : public + API Nitro) · Supabase Postgres 17 · `pg` en accès direct serveur ·
Tailwind 4 · Vitest · Resend (email, PDF en pièce jointe) · jsPDF (PDF en JavaScript pur).

Aucun navigateur sans interface, aucune file d'attente, aucun second serveur : tout tient dans
des fonctions éphémères, ce qui rend le déploiement Vercel possible sans dépendance externe.
Les écarts par rapport à la stack annoncée au PLAN.md §2 — pas de Drizzle, pas de
`@nuxtjs/supabase`, pas de `nuxt-og-image`, pas de pg-boss — sont motivés dans
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — choix techniques et exigence CDC satisfaite,
  modèle de données, flux sensibles, déploiement, sauvegardes, risques.
- [docs/RUNBOOK.md](docs/RUNBOOK.md) — exploitation courante et incidents.
- [docs/MANUEL_ADMIN.md](docs/MANUEL_ADMIN.md) — manuel de l'espace interne.
- [docs/RECETTE.md](docs/RECETTE.md) — recette technique et restes avant mise en ligne.
- [docs/DOCKER.md](docs/DOCKER.md) — pile de conteneurs : l'application et tout ce dont elle
  dépend, sans compte hébergé.
- `openapi.json` — contrat des 55 routes, régénéré par `pnpm openapi`.

## Arborescence

- `packages/scoring` — moteur pur, zéro dépendance. Versions V2.1 (archivée) et V2.2
  (publiée le 8 septembre 2026 : même matrice, règle de départage précisée, cas de contrôle
  `CCDBDACABDDACB` → Réformateur) coexistent dans `src/versions/` ; un snapshot est toujours
  relu avec sa version. Données JSON extraites de la matrice,
  47 contrôles. `public.ts` produit les projections d'affichage : le pilotage, les
  affinités, le tie-break et les hypothèses ne sortent jamais du serveur.
- `scripts/extract-matrix.ts` — xlsx → `packages/scoring/src/versions/v2.1/*.json` + checksum.
- `scripts/extract-maquette-frames.mjs` — maquette annexe 02 → `docs/maquette/frames/*.html`, un
  cadre par écran et par largeur (390, 834, 1440), à ouvrir à côté de l’application pour le
  contrôle visuel : `python3 -m http.server 8765` à la racine puis
  `/docs/maquette/frames/index.html`.
- `scripts/seed-scoring-version.ts` — seed idempotent de la version publiée en base.
- `supabase/migrations/` — schéma SQL, **source de vérité** : 28 tables.
- `server/api/public/` — sessions, participations, réponses, complétion, résultats, questions,
  leads (P10 : contact, rapport, lecture croisée, envoi de l'email avec le PDF joint),
  rapports (`reports/{token}` pour P12, `reports/{token}/pdf` généré à la demande avec jsPDF).
- `server/utils/` — accès base, jetons, session, erreurs, projections, rapport (`report.ts`),
  PDF (`pdf.ts`, jsPDF, Helvetica), email (`email.ts`, Resend, ligne `notification` par envoi).
- `app/admin/**` (pages), `app/layouts/admin.vue`, `app/middleware/admin.ts`, `app/composables/useAdmin.ts` —
  espace interne : A01 connexion et double authentification, acceptation d'invitation, A09, A10,
  réglages (identifiants de tracking). `server/api/admin/**` et `server/utils/{admin-auth,invitations,
  supabase,settings}.ts` : Supabase Auth côté serveur (clé service), cookie httpOnly `radar_admin`,
  RBAC vérifié par handler, `audit_log` alimenté.
- `app/` — écrans P01–P14 (P12 : `/rapport/{token}`), composants `radar/*` et `ui/*`, composable
  `useParticipation`. Deux layouts : `default` (navigation et pied de page, P01 et pages cadres)
  et `bare` (parcours, chaque page pose sa barre supérieure `RadarTopBar`).
- `test/` — migration SQL sur PGlite (vitest) + smoke tests HTTP (scripts Node).

## Démarrer

`node` par défaut est en v10 sur le poste de développement : forcer la v22 avant tout `pnpm`.

```bash
nvm use 22
pnpm install
pnpm dev
```

Tout en conteneurs, sans projet Supabase ni clé Resend — base, authentification, tâches
planifiées et boîte de réception comprises :

```bash
cp docker/.env.example docker/.env
node docker/scripts/generer-secrets.mjs >> docker/.env
docker compose --env-file docker/.env up -d --build
```

Montage, amorçage et limites : [docs/DOCKER.md](docs/DOCKER.md).

Env : copier `.env.example` → `.env`. En local, `DATABASE_URL` utilise la connexion directe
Supabase (port 5432). Sur Vercel, elle doit pointer le **pooler Supavisor en mode session** :
la connexion directe est IPv6-only et les fonctions Vercel n'ont pas d'egress IPv6. La valeur
prête est dans `.env` sous `DATABASE_URL_POOLER`. Ne jamais utiliser le port 6543 (mode
transaction) : il ne supporte pas les prepared statements.

## Tests

```bash
pnpm test          # moteur (47) + migrations SQL sur PGlite (10), sans base externe
pnpm test:api      # parcours HTTP : session, réponses, reprise, abandon (26 contrôles)
pnpm test:results  # calcul, snapshot, idempotence, cas normatifs §5.5 (15 contrôles)
pnpm test:leads    # contact, consentement CMP01, rapport, email (10 contrôles)
pnpm test:admin    # invitation, 2FA TOTP, RBAC, gardes admin (23 contrôles, crée des comptes de test)
pnpm test:metier   # admin métier : dashboard, prospects, fiche, participation, leviers, exports (30 contrôles)
pnpm test:lot6     # rapports et emails, webhook Resend, versions du moteur (23 contrôles)
pnpm test:reset    # réinitialisation du mot de passe admin (23 contrôles)
```

Sauf `pnpm test`, toutes exigent un serveur lancé et écrivent dans la base pointée par
`DATABASE_URL` — ne jamais les lancer sur la production. Elles acceptent `APP_BASE_URL` pour
viser un déploiement plutôt que localhost.

Il n'y a pas d'intégration continue : ces commandes sont le seul filet avant livraison.

## Base de données

Le schéma est appliqué sur le projet Supabase en ligne : 26 tables, RLS activé sans policy sur
toutes (deny-all, accès service role uniquement), triggers d'immutabilité sur les snapshots,
l'historique des réponses et les versions publiées.

```bash
pnpm seed:scoring [version]   # publie la version (défaut 2.2), archive la précédente (idempotent)
```

Comptes admin : `pnpm seed:admins` crée l'administrateur principal (`amedeel@feexpay.me`) et
une invitation de 7 jours par adresse de la liste du 8 septembre (domaines `feexpay.me` et
`bigfiveabidjan.com`), puis imprime les liens à transmettre. La politique de mot de passe
(12 caractères, contrôle HIBP) et la double authentification TOTP (obligatoire Analyste et
Administrateur) sont appliquées par l'application ; au dashboard Supabase, laisser les
inscriptions publiques désactivées.

Admin métier (lot 5, cadres A02 à A08) : dashboard sur période glissante comparée à la
précédente, liste des prospects avec filtres et pagination serveur, fiche prospect en cinq
onglets (synthèse, diagnostic commercial, participations, rapports et emails, historique),
détail de participation, états vides et erreurs. Les « Leviers FeexPay associés » de A05
(maquette qui prime sur le CDC) reposent sur la table `levier_feexpay` / `levier_constat`,
rattachée à la dimension des constats et modifiable dans Réglages → Leviers FeexPay. Le suivi
commercial (statut, responsable, notes internes) vit dans `prospect_suivi` / `prospect_note`.
Chaque export (CSV, PDF de fiche, JSON de réponses) exige `export_allowed` sur le compte et
laisse une ligne dans `export_job` et `audit_log`. « Renvoyer le rapport » réémet le même
rapport avec un nouveau jeton, l'ancien lien devenant invalide.

Rapports et emails (lot 6, cadre A07) : taux de remise, d'ouverture et de consultation en
ligne comparés à la période précédente, journal des envois filtrable, renvoi, correction
d'adresse puis renvoi, relance groupée des échecs, aperçu des modèles avec le cas de contrôle
principal. Les statuts « remis », « ouvert » et « rejeté » viennent du webhook Resend
(`POST /api/public/webhooks/resend`, signature Svix vérifiée avec `RESEND_WEBHOOK_SECRET`,
à déclarer dans le dashboard Resend une fois le domaine vérifié). Versions du moteur (T01) :
registre des versions du code et de la base, contrôles automatiques (cas §5.5, huit
archétypes, départage V2.2, checksum), publication ou réactivation par un Administrateur,
journalisées. Une version publiée reste immuable et chaque participation garde la sienne.

## Règles

- Jetons publics : 32 octets aléatoires en base64url, stockés en sha256, jamais journalisés.
  Une participation n'est accessible qu'avec le cookie de session correspondant.
- Aucune donnée interne côté client : affinités, tie-break, hypothèses et constats de la fiche
  commerciale restent serveur (vérifié par test sur la réponse de l'API). Décision client du
  8 septembre 2026 : la maquette prime, donc le niveau de pilotage et sa lecture (P08, P12),
  la force et la difficulté déclarées (P09) sont publics.
- Consentement (CDC V1.2) : bandeau C01 et panneau C02 dans `app/components/consent/Banner.vue`,
  choix tenu six mois dans le navigateur et prouvé dans `consent_record` ; GA4 et Meta Pixel
  ne se chargent qu'après le choix (`app/plugins/tracking.client.ts`, identifiants lus dans
  `app_setting`). CMP01 dans P10 : case obligatoire vérifiée côté serveur, case contact
  facultative, preuve par ligne `consent_record`. La politique de confidentialité s'ouvre en
  fenêtre modale sur P10 : quitter la page ferait perdre la saisie en cours. Pages L01 et L02
  avec textes provisoires — le corps de L01 vit dans `LegalConfidentialiteTexte`, partagé par
  la page et la modale.
- Tracking serveur : ce que le navigateur ne peut pas envoyer passe par
  `tracking_event_outbox`, dont l'unicité d'`event_id` rend chaque envoi idempotent. CAPI pour
  Lead et quiz_completed avec l'`event_id` du Pixel (`server/utils/capi.ts`) ; GA4 Measurement
  Protocol pour `report_generated` et `report_sent` (`server/utils/ga4.ts`, secret d'API à
  saisir dans Réglages). Aucun envoi n'est bloquant : les échecs restent visibles dans la table
  avec leur cause.
- Sécurité HTTP : HSTS, CSP, `X-Frame-Options: DENY`, `Referrer-Policy` et `Permissions-Policy`
  posés par `routeRules`. HSTS et CSP en production seulement — le rechargement à chaud de Vite
  exige `eval` et un WebSocket. La CSP porte `script-src 'unsafe-inline'` : Nuxt écrit le
  payload d'hydratation en ligne sans nonce (compromis détaillé dans docs/ARCHITECTURE.md).
- Parcours hors ligne : une réponse qui ne part pas faute de réseau est conservée dans le
  navigateur et rejouée au retour, l'écriture serveur étant idempotente. La complétion vide la
  file avant de lancer le calcul.
- Parcours abandonnés : `/api/cron/abandon`, appelée quotidiennement par la tâche planifiée de
  `vercel.json` (jeton `CRON_SECRET`), clôture les participations dont la session de reprise a
  expiré. Les réponses ne sont pas touchées.
- Administration : mot de passe oublié sur `/admin/mot-de-passe-oublie`, lien d'une heure à
  usage unique. La réponse est la même que l'adresse existe ou non, le second facteur reste
  exigé, et l'application du nouveau mot de passe ferme les sessions ouvertes.
- Email : sans domaine vérifié chez Resend, `onboarding@resend.dev` ne délivre qu'à l'adresse du
  titulaire du compte. Chaque tentative laisse une ligne `notification` (accepted ou failed avec
  l'erreur) ; le rapport et le PDF restent accessibles par le lien quoi qu'il arrive.
- Aucune recommandation produit : le tag « Produit FeexPay » n'est pas extrait de la matrice.
- `noindex` partout sauf `/`.
- Interface : les valeurs de la maquette (annexe 02) priment sur le design system générique
  qu'elle embarque. Poppins est self-hosted, les icônes viennent de `@mdi/js` (SVG inline, seuls les
  glyphes nommés dans `UiIcon` entrent dans le bundle) — le design system interdit
  explicitement les emoji. Trois compositions par écran, relevées sur les cadres 390, 834 et
  1440 : les textes eux-mêmes varient par largeur.
