# Radar by FeexPay — Plan de développement

> Fichier unique de reprise. Tout ce qu'il faut pour démarrer et suivre le dev.
> Sources normatives (ordre de prévalence) : CDC V1.1 > Matrice V2.1 > Plan tracking V1.0 > Maquettes (Annexe 02) > Kit graphique (Annexe 03).
> Reprise : commencer par Lot 0 (§9). Cocher les étapes au fur et à mesure.

---

## 0. État d'avancement (mis à jour le 2026-09-08)

| §9 | Étape | État |
|---|---|---|
| 1 | Workspace pnpm + TS | partiel — workspace + `packages/scoring` OK ; **Nuxt 4.5 installé, `pnpm dev` opérationnel** (`nuxt.config.ts`, `app/{app.vue,layouts,pages/index.vue,assets/css}`, `server/api/public/health.get.ts`, Tailwind 4 via `@tailwindcss/vite`, `X-Robots-Tag` par `routeRules`). Manque : ESLint/Prettier, Playwright, modules `@nuxtjs/supabase` / `nuxt-og-image`, Poppins, MDI |
| 2 | Supabase local + `.env.example` | **projet en ligne opérationnel** (`lssvoupqvcdlufbegghd`, PostgreSQL 17.6) : `.env` renseigné, connexion Postgres et API REST vérifiées le 2026-09-08. Manque : `supabase start` en local (CLI et Docker absents du poste), séparation staging/prod |
| 3 | `packages/db` (Drizzle, RLS, seed) | **migration appliquée en ligne** : 21 tables, RLS activé sans policy sur les 21 (deny-all, service role seul), 18 triggers dont immutabilité — testé, `VERSION_LOCKED` remonte bien. Manque : `packages/db` (schéma Drizzle + drizzle-kit), seed admin, config Auth (signups off, HIBP, MFA) |
| 4 | CI, logger, en-têtes sécurité | partiel — `correlation_id` en place (`server/middleware/correlation.ts`, en-tête `x-correlation-id` + repris dans chaque erreur). Manque : logger pino, HSTS/CSP. **CI GitHub Actions abandonnée** : déploiement via Vercel |
| 5 | Assets de marque | **fait** — logos, 8 emblèmes, hero, tokens CSS, **Poppins self-hosted** (4 graisses woff2, latin + latin-ext, 52 Ko, preload), **icônes MDI** en sous-ensemble SVG (`app/components/ui/Icon.vue`) remplaçant les emoji interdits par le design system. Manque : variantes AVIF/WebP du hero |
| 6 | `docs/ARCHITECTURE.md` | à faire |
| 6b | `scripts/extract-matrix.ts` → JSON v2.1 | **fait** — 21 questions, 84 options, 8 archétypes, 16 règles, checksum `4513791…` |
| 7 | `packages/scoring` + tests §5.5 | **fait** — 44 tests verts (`pnpm --filter @radar/scoring test`) |
| 8 | Seed `scoring_version 2.1` | **fait** — `scripts/seed-scoring-version.ts` (idempotent, transactionnel) : version 2.1 `published`, 14 + 7 questions, 84 options, checksum `4513791…` identique au moteur (`GET /api/public/health` → `checksumMatch: true`) |
| 9 | Lot 1 étape 9 — API parcours | **fait** — `server/api/public/{sessions.post,participations.post,participations/[token].get,participations/[token]/answers/[questionCode].put,participations/[token]/abandon.post}.ts` + `server/utils/{db,tokens,errors,session,participation}.ts`. Cookie `radar_sid` httpOnly 7 j glissants, acquisition first-touch, jetons hashés, zod strict. 26 contrôles verts (`pnpm test:api`) |
| 10 | Lot 1 étape 10 — écrans P01–P07 | **fait, repris au gabarit de la maquette** — `app/pages/{index,diagnostic/index,diagnostic/[type]/introduction,diagnostic/[type]/question/[numero],diagnostic/[type]/calcul}.vue` + composants `AnswerCard`, `ProgressBar`, `DimensionBars`, `WeatherCard`, composable `useParticipation`, plus `Skeleton` et `StepMeta`. Fondations CSS complètes : échelle typographique responsive, rayons, hauteurs de contrôle (44/52/56), ombres teintées navy, mouvement (140/220/360 ms, `cubic-bezier(.2,0,0,1)`), `:focus-visible` global au halo 3 px orange-300, neutralisation sous `prefers-reduced-motion`. `AnswerCard` porte ses 6 états spécifiés. En-tête 76 px collant, footer 4 colonnes, liste d'étapes en P07. Vérifié au navigateur à 390 px et en desktop |
| 11 | Lot 2 étape 11 — résultats P08/P09 | **fait** — `complete` (snapshot immuable, idempotent) + `GET /results` + `app/pages/resultat/[type]/[token].vue`. Cas normatifs vérifiés de bout en bout par HTTP : Stratège, 67 Challenger fort, 0, 100 (`pnpm test:results`) |
| 12+ | Lot 3 et suivants | à faire — **plus aucun blocage externe** (cf. ci-dessous). Prochaine étape : déploiement Vercel, puis P10/P11, rapport et PDF jsPDF, envoi Resend |

Écart assumé vs §2 : **Nuxt 4.5** au lieu de Nuxt 3 — même API, et sa structure par défaut
(`app/pages`, `app/components`, `app/layouts`) est exactement l'arborescence cible du §3.
Tailwind 4 est câblé par le plugin Vite officiel plutôt que par `@nuxtjs/tailwindcss`
(le module n'est pas requis pour Tailwind 4).

Prérequis machine : `node` par défaut est en v10 → `nvm use 22` avant tout `pnpm`.
`supabase` CLI et `docker` **ne sont pas installés** sur ce poste : `supabase start` est
impossible en l'état. On travaille donc directement sur le projet Supabase en ligne.

**Déploiement : Vercel** (décidé le 2026-09-08, pas de CI GitHub Actions). Trois choix
techniques ont été changés le 2026-09-08 pour que l'application tienne entièrement dans des
fonctions éphémères et ne dépende plus d'aucun élément extérieur :

1. **Base** — la connexion directe `db.<ref>.supabase.co` est IPv6-only (aucun enregistrement
   A) et les fonctions Vercel n'ont pas d'egress IPv6. `DATABASE_URL` sur Vercel doit donc
   pointer le **pooler Supavisor en mode session** :
   `postgresql://postgres.<ref>:<mdp>@aws-0-eu-west-2.pooler.supabase.com:5432/postgres`
   (valeur prête dans `.env` sous `DATABASE_URL_POOLER`, mot de passe percent-encodé).
   Vérifié : résolution IPv4, connexion, données visibles, **prepared statements acceptés**.
   Le port 6543 (mode transaction) reste à proscrire. La connexion directe reste bonne en local.
   À noter : le pooler est en `eu-west-2` (Londres), pas à Francfort comme l'annonce le §2.
2. **PDF** — Playwright abandonné. La limite de durée d'une fonction est de **10 s en Hobby**
   (60 s en Pro) : un démarrage à froid de Chromium en consomme l'essentiel. Remplacé par une
   génération en JavaScript pur (jsPDF) dans une route Nitro, à la demande, déposée dans
   Supabase Storage. Compromis assumé : mise en page codée en coordonnées, pas un jumeau pixel
   du rapport HTML.
3. **File d'attente** — pg-boss abandonné. Le cron Vercel en Hobby est plafonné à **une
   exécution par jour**, inutilisable pour du transactionnel. L'envoi Resend se fait dans la
   requête et la table `notification` sert de journal ; le renvoi manuel depuis l'admin
   remplace le retry automatique, ce que le CDC prévoit déjà.

**Email sans accès DNS** : `RESEND_FROM` en variable d'environnement (défaut
`onboarding@resend.dev`, qui ne délivre qu'à l'adresse du titulaire du compte Resend) et
`MAIL_ALLOWLIST` optionnelle, qui journalise au lieu d'échouer pour les destinataires hors
liste. Le jour où un domaine — **n'importe lequel, pas forcément `feexpay.me`** — est vérifié
dans Resend, on change la variable. Aucun changement de code.

**Conséquence : plus aucune seconde machine, plus aucun accès DNS requis pour livrer.**

Mot de passe `DATABASE_URL` : percent-encodé le 2026-09-08 (`&`→`%26`, `+`→`%2B`, `*`→`%2A`),
connexion revérifiée. Le mot de passe brut est rappelé en commentaire dans `.env`.

Détail du moteur livré (§7) : `src/{types,errors,utils,data,answers,dirigeant,rayonnement,cross,insights,public}.ts`.
`public.ts` produit les projections P08/P09 sans pilotage, sans classement des 8 archétypes, sans affinités —
le reste ne sort jamais du serveur. Règle de départage appliquée : dimension centrale, comparaison après
arrondi à 2 décimales (défaut §10.1, à confirmer par Cossi CODJIA).

---

## 1. Contexte

FeexPay (accompagné par Big Five) veut **Radar by FeexPay** (`radar.feexpay.me`) : web app mobile-first, publique sans compte, avec deux diagnostics indépendants :

- **Profil du dirigeant** : 14 questions (Q1–Q14, 4 options A–D) → 1 archétype principal parmi 8 (+ secondaire éventuel).
- **Rayonnement de l'entreprise** : 7 questions (R1–R7, 4 options) → score 0–100, 5 niveaux + météo.

Résultat gratuit affiché **avant** tout formulaire. Formulaire (P10) débloque rapport en ligne + PDF + email. Côté FeexPay : back-office admin (prospects, fiche commerciale explicable, rapports, comptes, versions). **Aucune recommandation produit automatique.** Moteur déterministe, versionné, serveur-autoritatif.

État au 2026-09-05 : Lots 0–2 livrés (workspace, migration SQL, moteur scoring testé, API publique, P01–P09, tests PGlite + e2e). Voir §9 pour le détail coché.

---

## 2. Décisions techniques (stack non imposée par le CDC — validée le 2026-09-05 : Nuxt + Supabase)

| Couche | Choix | Pourquoi |
|---|---|---|
| App | **Nuxt 3 (Vue 3, TypeScript)**, monolithe : public + admin + API Nitro | 1 seul déploiement, SSR pour SEO P01, `routeRules` noindex, Nitro pour l'API |
| API | Nitro `server/api/public/**`, `server/api/admin/**`, `server/middleware/` (correlation_id, RBAC) + **zod** + OpenAPI (`zod-to-openapi` → `openapi.json`) | CDC exige OpenAPI + validation stricte |
| DB | **Supabase Postgres** (région EU Frankfurt) + **Drizzle ORM** (migrations SQL versionnées, appliquées via Drizzle, pas via dashboard) | Base relationnelle imposée, contraintes, transactions. Accès serveur uniquement (service role), RLS activé en défense en profondeur, aucun accès client direct aux tables |
| Auth admin | **Supabase Auth** : invitation-only (`auth.admin.inviteUserByEmail`, inscriptions publiques désactivées), mot de passe ≥12 + HIBP, **MFA TOTP natif** (`mfa.enroll/challenge/verify`, claim `aal2`), sessions cookie via `@nuxtjs/supabase` | Couvre invitation, 2FA, sessions, suspension (`admin.signOut` global / ban) |
| Auth — maison | rôle/équipe dans `app_metadata` + table `admin_user` miroir ; **2FA obligatoire par rôle** (middleware exige `aal2` pour Analyste/Admin) ; **codes de récupération** (hash argon2, usage unique) ; domaine `@feexpay.me` vérifié serveur ; **invitations 7 j** en table maison (lien Supabase généré seulement à l'acceptation) ; garde dernier admin ; `audit_log` | Lacunes Supabase vs CDC E.1/E.3 |
| Queue | **pg-boss** sur le Postgres Supabase, worker dans un plugin Nitro (ou process worker séparé en prod) | PDF, cartes, emails, exports, CAPI/MP ; retry borné, dead-letter, pas de Redis |
| Stockage objet | **Supabase Storage** (buckets privés, URLs signées courtes) | PDF, cartes, exports |
| PDF | **Playwright (chromium headless)** rendant `/rapport/{token}/print` | Même snapshot, même rendu que le rapport en ligne. Exige runtime Node long-running (Docker/VPS ou worker dédié) |
| Cartes partage | **nuxt-og-image** (satori + resvg, composants Vue) → PNG 4 formats | Sans navigateur, déterministe |
| Email | **Resend** + templates **vue-email** + webhooks signés | Transactionnel, statuts delivered/bounced |
| Tracking | Plugin client (`gtag`, `fbq`) + `server/utils/tracking` (GA4 MP, Meta CAPI) | Un point d'émission métier, 3 adaptateurs |
| UI | Tailwind 4 + tokens CSS Radar (`--fx-*`), Poppins self-hosted, MDI subset SVG, composants Vue SFC maison | Maquette prévaut sur `_ds/` générique (bundle React inutilisable) |
| Tests | **Vitest** (scoring unitaire, handlers Nitro via `@nuxt/test-utils`), **Playwright** e2e | Cas de contrôle obligatoires |
| Infra locale | **Supabase CLI** (`supabase start` : postgres, auth, storage, inbucket mail) | Env dev sans données réelles |
| CI | GitHub Actions : lint, typecheck, vitest, migrations sur DB éphémère, e2e smoke | Lot 0 |

Écartés : Next.js (préférence équipe Vue) ; BullMQ/Redis (pg-boss suffit, un service de moins) ; auth maison complète (Supabase couvre TOTP/sessions).
Point d'attention : Supabase sans région Afrique → Frankfurt ; mesurer latence Abidjan sur p95 API ≤ 500 ms.

---

## 3. Arborescence cible

```
radar/
  nuxt.config.ts               # routeRules noindex, modules supabase/og-image/tailwind
  app/
    pages/
      index.vue                # P01
      diagnostic/…             # P02–P07
      resultat/[type]/[token].vue      # P08/P09
      recevoir-mon-analyse/[token].vue # P10
      confirmation/[token].vue         # P11
      rapport/[token]/index.vue + print.vue   # P12
      partage/[token].vue              # P13/P14 (variante par type)
      admin/…                  # A01–A10, T01
    layouts/ public.vue, admin.vue
    middleware/ admin-auth.ts (session + aal2 + rôle)
    components/
      radar/   # AnswerCard, ProgressBar, StepMeta, SeverityTag, DifficultyCard,
               # ForceCard, HypothesisCard, FactCard, KpiCard, ScoreGauge,
               # DimensionBars, WeatherCard, EmptyValue, EmptyState, Skeleton
      ui/      # Button, Badge, Card, Field, Input, Select, Tabs, Alert, Toast, Dialog
      og/      # ShareCardDirigeant.vue, ShareCardEntreprise.vue (nuxt-og-image)
    composables/ useTracking.ts, useParticipation.ts
    plugins/ tracking.client.ts
  server/
    api/public/…  api/admin/…  api/webhooks/…
    middleware/ correlation.ts, rbac.ts
    utils/ auth (rbac, recovery codes, invitations), tokens.ts, tracking (ga4-mp, capi)
    plugins/ pgboss.ts (worker : pdf, share, email, export, capi)
    jobs/ pdf.ts, share.ts, email.ts, export.ts, tracking.ts
  packages/
    scoring/       # MOTEUR PUR, zéro dépendance. Versions en data.
      src/versions/v2.1/{questions.json, options.json, archetypes.json,
                         findings.json, combined-rules.json, constants.json}
      src/{dirigeant.ts, rayonnement.ts, cross.ts, insights.ts, index.ts}
      test/controls.test.ts    # cas Contrôles + limites + tie
    db/            # schéma Drizzle, migrations, seed v2.1
    email/         # 6 templates vue-email
  supabase/        # config.toml, seed auth local
  docs/ARCHITECTURE.md   # livrable H.2, choix techniques justifiés vs CDC
  openapi.json (généré)
  PLAN.md
```

---

## 4. Modèle de données (Drizzle / Postgres)

Tables (du CDC F.2) — toutes avec `id uuid`, `created_at`, `updated_at` :

- `scoring_version` (version, status enum draft|published|archived, checksum, published_at, author_id). **Trigger : UPDATE/DELETE interdit si status=published et référencée.**
- `question` (version_id, code Q1..Q14/R1..R7, diagnostic_type, ordre, texte) ; `option` (question_id, code Q1A…, texte, mapping jsonb : dim2, dim1, points, poids, applicable, tags[], nature, gravite, textes constats).
- `anonymous_session` (token_hash unique, expires_at = +7j, acquisition_id).
- `acquisition` (session_id, landing_url, referrer, utm_*, fbclid/gclid, device) — premier touch, jamais écrasé.
- `participation` (session_id, contact_id null, diagnostic_type, version_id, status in_progress|completed|abandoned, token_hash, parent_participation_id, started_at, completed_at, duration_s).
- `answer` (participation_id, question_id, option_id, answered_at, revised_at) **UNIQUE(participation_id, question_id)** + `answer_history`.
- `score_snapshot` (participation_id, version_id, scores jsonb, result jsonb, tie_break jsonb) — immuable, 1 par participation complétée.
- `insight_snapshot` (participation_id, version_id, items jsonb : facts/difficulties/forces/hypotheses/proofs).
- `contact` (prenom, nom, email_norm unique idx, phone_e164 idx, entreprise, secteur, taille, pays).
- `cross_reading` (contact_id, participation_dirigeant_id, participation_rayonnement_id, code CC|PS|RT|FR, pilotage, rayonnement, ecart, qualificatif).
- `report` (contact_id, snapshot_refs jsonb, token_hash, status, pdf_object_key, editorial_version, revoked_at).
- `notification` (report_id?, admin_invitation_id?, template, recipient, status queued|generated|accepted|delivered|opened|bounced|failed|cancelled, provider_id, attempts).
- `share_asset` (report_id, participation_id, format 1080x1350|1080x1080|1200x630|1080x1920, object_key, token_hash).
- `admin_user` (id = `auth.users.id`, prenom, nom, email @feexpay.me, role, team, status invited|active|suspended|revoked, mfa_enrolled_at, last_login_at). Mot de passe, TOTP et sessions gérés par Supabase Auth ; rôle/équipe dupliqués dans `app_metadata` pour le JWT.
- `admin_recovery_code` (admin_user_id, code_hash argon2, used_at) — 10 codes à l'enrôlement MFA, usage unique.
- `admin_invitation` (email, role, team, token_hash, inviter_id, expires_at +7j, status). Le lien Supabase (`generateLink` invite, 24 h max) n'est créé qu'à l'acceptation du jeton maison.
- `audit_log` (actor_id, action, target_type, target_id, payload_min jsonb, ip, ts) — append-only.
- `tracking_event_outbox` (event_name, event_id uuid, payload, targets, sent_at) — pour CAPI/MP serveur idempotents.
- `export_job` (author_id, scope, motif, status, object_key).

Jetons publics : 32 bytes random → base64url ; **stockés hashés (sha256)** ; jamais loggés.

---

## 5. Moteur de scoring (`packages/scoring`) — spécification exacte V2.1

### 5.1 Dirigeant
- Chaque option : `+2` dim principale, `+1` dim secondaire (8 dims : VIS STR EXE ORG INF AUD ADA TRA).
- `norm[d] = raw[d] / MAX[d] * 100`, MAX = {VIS 12, STR 15, EXE 17, ORG 18, INF 17, AUD 15, ADA 16, TRA 17}. Conserver float, ≥4 décimales.
- Affinité archétype = Σ poids × norm des 3 dims :

| Archétype | Inspiré par | Dims (c,2,3) | Poids |
|---|---|---|---|
| Stratège | Samory Touré | STR ADA ORG | .50 .30 .20 |
| Visionnaire | Kwame Nkrumah | VIS INF TRA | .50 .30 .20 |
| Bâtisseur | Aliko Dangote | EXE ORG STR | .50 .35 .15 |
| Conquérant | Shaka Zulu | AUD EXE VIS | .50 .35 .15 |
| Fédérateur | Nelson Mandela | INF ADA VIS | .50 .30 .20 |
| Résilient | Béhanzin | ADA EXE AUD | .50 .30 .20 |
| Gestionnaire | Tidjane Thiam | ORG STR EXE | .45 .30 .25 |
| Réformateur | Thomas Sankara | TRA AUD VIS | .50 .30 .20 |

- Principal = max affinité **arrondie à 2 déc.** Départage (ordre) : score norm de la dim centrale → nb de +2 (sur dim centrale, hypothèse à confirmer) → somme brute des 3 dims d'empreinte → ordre technique (Stratège, Visionnaire, Bâtisseur, Conquérant, Fédérateur, Résilient, Gestionnaire, Réformateur). Stocker `tie_break` jsonb.
- Secondaire si `aff2 ≥ 55 && aff2 ≥ 0.9*aff1 && aff1-aff2 ≤ 8`, sinon `null`. Doit être ≠ principal.
- **Pilotage interne** (jamais public) : questions Q4(10) Q5(15) Q6(15) Q7(15) Q8(10) Q9(10) Q10(10) Q12(15), points A=3 B=2 C=1 D=0. `pilotage = Σ(points/3×poids) / Σ(poids applicables) × 100`. **Q9D : poids exclu du dénominateur** (dénominateur 90). Niveaux : ≥75 structuré, ≥50 partiellement structuré, ≥25 réactif, sinon informel.

### 5.2 Rayonnement
- Points A=0 B=1 C=2 D=3 pour R1 R2 R4 R5 R6 R7. **R3 = tag seul** (Prix / Proximité / Qualité / Avantage distinctif), non scoré.
- Dimensions : Notoriété R1/3×100 (.20) ; Lecture concurrentielle R2 (.15) ; Différenciation R4 (.25) ; Digital = R5×.6 + R6×.4 (.20) ; Empreinte R7 (.20).
- Niveaux (bornes inclusives sur float non arrondi) : ≥80 Dominant/Soleil ; ≥60 Challenger fort/Éclaircies ; ≥40 Acteur silencieux/Nuageux ; ≥20 Marque fragile/Pluie ; <20 Zone de disparition/Tempête.
- Nuance « avec potentiel d'éclaircie » : `score < 80 && (seuilSup - score) ≤ 5 && count(dims ≥ seuilSup) ≥ 2 && min(dims) ≥ 20`.
- Affichage entier arrondi ; stockage exact.

### 5.3 Lecture croisée (seuil 60/60 sur floats)
CC (≥60,≥60) Cohérence consolidée · PS (≥60,<60) Potentiel sous-exploité · RT (<60,≥60) Rayonnement sous tension · FR (<60,<60) Fondations à renforcer.
Écart = rayonnement − pilotage : `|e| ≤ 15` cohérence relative ; `e > 15` rayonnement exposé ; `e < -15` fondations sous-exploitées (libellés onglet « Lecture croisée », pas ceux du Simulateur).

### 5.4 Insights (fiche commerciale)
- Bibliothèque : 1 constat par code option (84). Nature ∈ {Force, Difficulté, Point de vigilance, Contexte, Signal déclaré, Condition déclarée, Besoin déclaré}, gravité 0–3.
- Difficultés : `gravité>0 && difficulté≠""`, tri gravité desc puis index question asc, **max 6**, toujours la réponse exacte.
- Forces : `nature=="Force"`, **max 4**.
- Infos déclarées : Q11 canal, Q13 condition d'adoption, Q14 progrès prioritaire, R3 différenciation.
- Règles combinées RC01–RC16 : OR intra-groupe, AND inter-groupes (voir annexe §11), **max 6**, tri gravité desc puis id. Hypothèse au conditionnel + relance obligatoire.
- Preuves : exhaustif (code, question, option, version, date).
- Décision client du 8 septembre 2026 : la maquette prime sur le CDC. Les « Leviers FeexPay associés » de A05 (rattachement constat → produit) seront implémentés en admin (Lot 5), avec une table de correspondance éditable. Côté public, aucune recommandation produit.

### 5.5 Tests obligatoires (`controls.test.ts`)
| Cas | Dirigeant | Rayonnement | Attendu |
|---|---|---|---|
| Principal | `BCBADBADDBCADA` | `CCCCCCC` | Stratège 61.67 ; pilotage 62.96 ; ray 66.67 Challenger fort ; CC |
| A | `AAAAAAAAAAAAAA` | `AAAAAAA` | pilotage 100 ; ray 0 ; PS |
| B | `BBBBBBBBBBBBBB` | `BBBBBBB` | 66.67 ; 33.33 ; PS |
| C | `CCCCCCCCCCCCCC` | `CCCCCCC` | 33.33 ; 66.67 ; RT |
| D | `DDDDDDDDDDDDDD` | `DDDDDDD` | 0 ; 100 ; RT ; Q9D non applicable (dénominateur 90) |

Accessibilité archétypes (affinité, marge) : Visionnaire `ADCBCCAAADADAD` 63.48/23.5 · Bâtisseur `CADBCCBCBADCBB` 58.78/15.73 · Conquérant `DDADCCDBDCDABC` 70.15/25.36 · Fédérateur `CCCCCDADBBCBCA` 71.41/27.1 · Résilient `BADCDDCCCBCCBD` 65.44/21.15 · Gestionnaire `DABBABBBADADDC` 61.38/11.45 · Réformateur `DBDADACADABADA` 67.51/26.68.
Tie : `DBBCBABBDABDBA` → Réformateur 41.14 = Bâtisseur 41.14 (tester départage + secondaire ≠ principal).
Invariant : chaque dim apparaît 7× en +2 et 7× en +1 dans les 56 options.
Participation incomplète → `INCOMPLETE_PARTICIPATION`, jamais de calcul.

### 5.6 Extraction des données V2.1
Script `scripts/extract-matrix.ts` : lit le xlsx (openpyxl côté Python ou `xlsx` npm), génère `packages/scoring/src/versions/v2.1/*.json` + checksum. Textes repris **sans modification**. Le JSON généré est commité et devient la donnée de seed de `scoring_version 2.1`.

---

## 6. API (contrat minimal, OpenAPI généré)

**Public** (toutes réponses sans score interne / hypothèses) :
- `POST /api/public/sessions` → crée/reprend session (cookie `radar_sid`, 7j) + acquisition first-touch.
- `POST /api/public/participations` {type} → participation sur version active, retourne `token`.
- `GET /api/public/participations/{token}` → état, réponses, index courant.
- `PUT /api/public/participations/{token}/answers/{questionCode}` {optionCode} → idempotent, upsert + history.
- `POST /api/public/participations/{token}/complete` → valide 14/7 réponses, calcule, snapshot, retourne résultat public + `event_id` pour tracking. Idempotent (re-appel → même snapshot).
- `GET /api/public/results/{token}`.
- `POST /api/public/leads` {participationToken, prenom, nom, email, phone, entreprise, secteur, taille} + header `Idempotency-Key` → contact (rapprochement email_norm puis phone ; ambiguïté → flag, pas de fusion), report, jobs PDF/email, cross_reading si paire.
- `GET /api/public/reports/{token}` ; `POST /api/public/reports/{token}/pdf` ; `POST /api/public/shares/{token}` {format}.
- `POST /api/public/track` (serveur relais optionnel : reçoit `event_id` client pour CAPI DiagnosticComplete/Lead).

**Admin** : `auth/login` (Supabase password → `aal1`), `auth/2fa/enroll`, `auth/2fa/verify` (challenge TOTP → `aal2`) ou `auth/2fa/recovery`, `auth/logout`, `dashboard`, `prospects` (+`/{id}`, `/{id}/diagnostic`), `participations/{id}`, `reports/{id}/resend`, `exports`, `invitations` (+ accept), `users/{id}` PATCH, `versions`, `versions/publish`.

Erreurs : `INVALID_ANSWER`, `INCOMPLETE_PARTICIPATION`, `SESSION_EXPIRED`, `VERSION_INACTIVE`, `DUPLICATE_SUBMISSION`, `REPORT_PENDING`, `FORBIDDEN_SCOPE` (403 sans contenu partiel), `LAST_ADMIN_GUARD`, `INVITATION_EXPIRED`. Chaque réponse porte `correlation_id`.

RBAC (vérifié côté API, refus par défaut) : Lecture seule / Commercial / Analyste / Administrateur — matrice CDC E.2. Gardes : pas d'auto-rétrogradation ; dernier admin actif protégé ; changement de rôle invalide sessions.

---

## 7. Écrans (routes, composants clés, règles)

Public (mobile 390 / tablette 834 / desktop 1440 ; 320 px min ; contrôles ≥48 px ; corps 16 px ; `noindex` partout sauf `/`) :

| ID | Route | Points clés |
|---|---|---|
| P01 | `/` | Hero `hero-archetypes-orbit` (AVIF/WebP/JPEG, srcset 390/834/1440), 2 bénéfices, durée, « aucun formulaire avant résultat », CTA. Seule page indexée, OG. `landing_view`. |
| P02 | `/diagnostic` | 2 cartes indépendantes. `diagnostic_selected`. |
| P03/P05 | `/diagnostic/{dirigeant\|rayonnement}/introduction` | Crée session+participation. P05 signale si Dirigeant déjà fait. |
| P04/P06 | `/diagnostic/{type}/question/{index}` | 1 question/écran, AnswerCard, aucune présélection, Suivant inactif sans choix, retour sans perte, sauvegarde serveur idempotente + file locale si offline, reprise 7j avec compteur. Desktop : rail de progression, max 640 px. `diagnostic_started` (q1), `question_answered` (code+index seulement). |
| P07 | `/diagnostic/{type}/calcul` | Pas de spinner nu, message >10 s, reduced-motion. `diagnostic_completed` après réponse serveur. |
| P08 | `/resultat/dirigeant/{token}` | Archétype, emblème 256, « inspiré par », traits, forces, vigilance, DimensionBars, secondaire. **Pas de pilotage, pas de classement des 8.** `result_viewed`. |
| P09 | `/resultat/rayonnement/{token}` | Score entier, niveau, WeatherCard (icône + libellé), 5 dims, différenciation R3. |
| P10 | `/recevoir-mon-analyse/{token}` | 7 champs (prénom, nom, email, tél E.164, entreprise, secteur+Autre, taille), validation client+serveur, Idempotency-Key, bouton verrouillé. Pas redemandé si déjà converti. Jamais les mots « collecte », « coordonnées ». `lead_form_viewed`, `form_start`, `lead_submitted` (après serveur). |
| P11 | `/confirmation/{token}` | Email masqué, lien rapport immédiat, états PDF/email, CTA second diagnostic. Pas d'animation festive. |
| P12 | `/rapport/{token}` | Profil, dims, rayonnement, lecture croisée si paire, synthèse, portée, CTA générique `contact.ci@feexpay.me` (`feexpay_cta_clicked`). Sommaire latéral desktop. `/print` pour PDF. |
| P13/P14 | `/partage/{token}` | Variante dirigeant (navy) / entreprise (orange plein, logo blanc mono). 4 formats. WhatsApp, LinkedIn, télécharger, copier, Web Share. Zéro donnée interne. `result_shared`. |

Admin (1440, exploitable 1024, sidebar navy, menus masqués par rôle **et** API vérifiée) : A01 connexion+2FA, A02 dashboard (entonnoir, archétypes, niveaux, lecture croisée, acquisition ; filtres URL), A03 prospects (pagination serveur, filtres URL, export), A04 fiche synthèse (5 onglets), A05 diagnostic commercial (ordre : synthèse, difficultés 6, forces 4, infos 4, hypothèses 6, preuves ; actions : copier relance, exporter fiche), A06 participation (réponses, calcul, tie-break, version), A07 rapports/emails (renvoi = même snapshot), A08 états transverses (vide, filtres, partiel, erreur, refusé, skeleton), A09 invitation (@feexpay.me only, 7j, renvoi invalide l'ancien), A10 comptes, T01 versions (registre, publication avec contrôles automatiques, rollback = réactivation).

À ajouter (absents des maquettes) : 404 public, lien expiré/révoqué, page hors-ligne, mentions légales / confidentialité (cf. §10).

---

## 8. Tracking

- `lib/tracking/emit(event, params)` : un seul point d'émission → adaptateurs GA4 (`gtag`, `send_page_view:false`, enhanced measurement page_view/form désactivés), Meta Pixel (`fbq` avec `{eventID}`), et pour `diagnostic_completed` + `lead_submitted` : `event_id` uuid généré **serveur** dans la réponse API, réutilisé par Pixel ; serveur envoie CAPI (job outbox) avec même `event_name`/`event_id`.
- `report_generated`, `report_sent` : GA4 Measurement Protocol serveur uniquement. `question_answered` : GA4 seul.
- Mapping complet des 14 événements et paramètres : voir rapport tracking (§A.2/A.3 du plan tracking). Jamais : réponses, valeurs formulaire, secrets, `test_event_code` en prod.
- Env : `PUBLIC_GA4_MEASUREMENT_ID`, `PUBLIC_META_PIXEL_ID`, `GA4_API_SECRET`, `META_CAPI_ACCESS_TOKEN`, `META_GRAPH_API_VERSION`, `META_CAPI_TEST_EVENT_CODE` (staging), `TRACKING_ENABLED`.
- Recette : 14 tests du plan (DebugView + Meta Test Events) avant prod.

---

## 9. Lots et ordre d'exécution

**Lot 0 — Socle (jour 1–3)**
1. ✅ (partiel : ESLint/Prettier/Playwright e2e non installés) `pnpm` workspace, Nuxt 3, TS strict, Vitest ; modules `@nuxtjs/supabase`, `nuxt-og-image`, Tailwind.
2. ⏳ (Supabase en ligne retenu, pas de CLI local ; env à renseigner) `supabase init` + `supabase start` (postgres, auth, storage, inbucket) ; projet Supabase staging/prod région Frankfurt ; `.env.example` documenté (`SUPABASE_URL`, `SUPABASE_KEY` anon, `SUPABASE_SERVICE_KEY` serveur, `DATABASE_URL`).
3. ✅ (`supabase/migrations/20260905000000_init.sql` source de vérité + `server/db/schema.ts` miroir Lot 1–3 ; seed admin ⏳) `packages/db` : schéma Drizzle complet (§4), migrations, triggers immutabilité, RLS deny-all sur tables métier (accès service role seulement), seed admin initial (script one-shot : `inviteUserByEmail` + ligne `admin_user`). Config Auth : signups off, password ≥12 + HIBP, MFA TOTP on.
4. ✅ CI GitHub Actions ; ✅ `correlation_id` ; ⏳ pino, headers sécurité (HSTS/CSP). Headers sécurité (HSTS, CSP, noindex middleware).
5. ✅ (assets → `public/brand/`, tokens CSS Tailwind 4 ; ⏳ Poppins self-hosted, MDI) Copier assets Annexe 02 `assets/` → `app/public/brand/` ; tokens CSS Radar ; Poppins self-hosted ; MDI subset.
6. ⏳ `docs/ARCHITECTURE.md` (livrable H.2 n°2, exigé par CDC F.1 « choix consignés dans la documentation d'architecture ») :
   - choix techniques (§2 de ce plan) avec, pour chacun, l'exigence CDC satisfaite (E.1, F.1, G.1, G.3, G.5…) ;
   - schéma de données (§4) + diagramme ER généré depuis Drizzle ;
   - diagramme de déploiement : Nuxt/Nitro (Docker) + worker pg-boss/Playwright, Supabase (Postgres, Auth, Storage) Frankfurt, Resend, GA4/Meta ; trois environnements dev (Supabase local) / staging / prod ;
   - flux sensibles : jetons publics hashés, clé service Supabase serveur seulement, secrets par environnement ;
   - sauvegardes : plan Supabase retenu, PITR ou backups quotidiens, procédure de restauration, RPO/RTO ;
   - risques et mesures (latence Abidjan→Frankfurt, Playwright long-running, absence de région Afrique).
   Mis à jour à chaque changement de choix technique ; référencé depuis README.

**Lot 2 avant Lot 1 (moteur d'abord, pur, testable)**
6. ✅ `scripts/extract-matrix.ts` → JSON v2.1 + checksum.
7. ✅ `packages/scoring` : dirigeant, rayonnement, cross, insights ; tests §5.5 verts (26 tests).
8. ✅ Seed `scoring_version 2.1` published + questions/options (`server/db/seed.ts`).

**Lot 1 — Parcours questions**
9. ✅ API sessions/participations/answers ; cookie session ; reprise 7j ; ⏳ abandon (cron).
10. ✅ P01–P07 + AnswerCard, ProgressBar (⏳ StepMeta, Skeleton, file offline, contrôle visuel 390/834/1440 vs maquette).

**Lot 2 suite — Résultats**
11. ✅ `complete` → snapshot + insight_snapshot ; P08/P09 ; DimensionBars, WeatherCard, emblèmes (⏳ ScoreGauge).

**Lot 3 — Conversion**
12. `leads` + rapprochement contact + cross_reading ; P10/P11.
13. Report + token ; P12 + `/print` ; job pg-boss PDF Playwright → Supabase Storage ; job email Resend + webhooks ; 3 templates rapport.
14. Share assets nuxt-og-image 4 formats → Storage ; P13/P14 ; Web Share.

**Lot 4 — Admin auth**
15. Invitations maison 7 j → `generateLink` Supabase ; enrôlement TOTP obligatoire au premier login Analyste/Admin ; codes de récupération ; middleware `aal2` + rôle (`app_metadata`) ; gardes admin (dernier admin, auto-rétrogradation, suspension = `admin.signOut` global) ; `audit_log` ; A01, A09, A10 ; templates invitation/reset/alerte.

**Lot 5 — Admin métier**
16. A02 dashboard KPI ; A03 liste ; A04/A05/A06 ; cartes Difficulty/Force/Hypothesis/Fact, SeverityTag, KpiCard, EmptyState/EmptyValue. Livré le 8 septembre 2026 : migration `20260908140000_admin_metier.sql` (leviers, suivi, notes), utilitaire `server/utils/admin-metier.ts`, dix routes `/api/admin/**`, pages `admin/index`, `admin/prospects/**`, `admin/participations/**`, `admin/reglages/leviers`, test `test/api-metier.mjs`.

**Lot 6 — Ops admin**
17. A07 rapports + renvoi ; exports async journalisés ; T01 versions + publication contrôlée ; A08 états. Livré le 9 septembre 2026 : migration `20260909000000_rapports_versions.sql` (journal d'envoi, ouverture en ligne), `server/utils/{rapports,versions}.ts`, `packages/scoring/src/controls.ts` (cas de contrôle partagés test/admin), webhook Resend, pages `admin/rapports`, `admin/versions`, test `test/api-lot6.mjs`.

**Lot 7 — Lancement**
18. Tracking complet + recette 14 tests ; WCAG 2.2 AA (axe + clavier) ; Lighthouse (LCP ≤2.5 s, CLS ≤0.1) ; revue OWASP ASVS ; sauvegarde/restauration testée ; docs (architecture, OpenAPI, runbook, manuel admin).

---

## 10. Questions ouvertes (à trancher, non bloquantes pour Lots 0–2)

1. **Départage archétypes** : règle en une ligne dans le xlsx, onglet « Archétypes & règles », cellule **B31** ; ordre technique en B32. Non programmable telle quelle (« nombre de +2 » sur dim centrale ou sur les 3 dims ? secondaire avant/après arrondi 2 déc. ?). Le Simulateur (B3) ne l'applique pas (premier de la liste). Détail probablement dans `TDR_Radar_by_FeexPay_V1_Valide.docx`, cité en « Vue d'ensemble » B24, **absent du pack**. À demander à Cossi CODJIA. Défaut retenu en attendant : dim centrale ; après arrondi. Ties ≈ 1/600.
2. **RGPD / consentement** : aucun CMP ni Consent Mode dans CDC ni plan tracking. Défaut retenu : bandeau minimal + Consent Mode v2, tracking off tant que refus ; mentions légales + politique de confidentialité en footer. Rétention contacts/participations à définir.
3. **Libellés écart** : onglet « Lecture croisée » vs Simulateur → retenu onglet.
4. **Fournisseurs** : Supabase confirmé (DB, auth, storage). Reste : email (Resend vs Brevo) et hébergement Nuxt (Docker/VPS recommandé à cause de Playwright, sinon worker PDF séparé). Frais et titulaire des comptes (Big Five ou FeexPay) non tranchés : ne rien ouvrir avant réponse.
5. Réinitialisation mot de passe admin « si activé » ; notes internes A04 ; licence MDI.
6. Météo : maquette montre 5 libellés différents des niveaux matrice (ex. « Marque de référence » vs « Dominant ») → matrice prévaut.

### 10b. Éléments demandés au chef de projet / client — attendus avant le **18 septembre 2026** (email envoyé le 05/09)

| # | Élément | Interlocuteur (CDC H.6) | Bloque |
|---|---|---|---|
| 1 | Accès DNS feexpay.me ou délégation du sous-domaine (radar.feexpay.me, TLS, SPF/DKIM/DMARC) | client via CP | Lot 0 staging, Lot 3 emails, mise en prod |
| 2 | Hébergement : frais à la charge de qui, titulaire des comptes (Supabase, Resend, hébergeur) | CP / contrat | Lot 0 (ouverture des comptes) |
| 3 | Adresse @feexpay.me du premier admin + liste des invités (nom, email, rôle) | client | Lot 4 |
| 4 | GA4 measurement ID + API secret, Meta Pixel ID, token CAPI, code de test Meta | Morel KOUADIO | Lot 7 |
| 5 | Politique de confidentialité, mentions légales, rétention des contacts, arbitrage bandeau cookies | Cossi CODJIA / client | Lot 7, mise en prod |
| 6 | Règle de départage détaillée (cf. §10.1) + `TDR_Radar_by_FeexPay_V1_Valide.docx` | Cossi CODJIA | fin Lot 2 (moteur) |
| 7 | Confirmation que logos + illustration du pack sont définitifs | Morel KOUADIO | Lot 1 |

En attendant : Lots 0–2 réalisables en local (Supabase CLI) sans aucun de ces éléments.

---

## 11. Annexe — Règles combinées RC01–RC16

| ID | Gravité | Condition |
|---|---|---|
| RC01 | 2 | Q11C ∧ (R6A∨R6B∨R6C) |
| RC02 | 2 | Q11B ∧ (R6A∨R6B) |
| RC03 | 2 | Q11A ∧ (R6A∨R6B) |
| RC04 | 3 | (Q10C∨Q10D) ∧ (Q11A∨Q11B∨Q11C) |
| RC05 | 3 | (Q6B∨Q6C∨Q6D) ∧ (Q7C∨Q7D) |
| RC06 | 3 | (Q4C∨Q4D) ∧ (Q5C∨Q5D) |
| RC07 | 3 | (Q9B∨Q9C) ∧ (Q5C∨Q5D) |
| RC08 | 3 | (Q8C∨Q8D) ∧ (Q4C∨Q4D) |
| RC09 | 2 | (R5A∨R5B) ∧ (R6A∨R6B) |
| RC10 | 2 | (R1A∨R1B) ∧ (R5A∨R5B) |
| RC11 | 3 | (R2A∨R2B) ∧ (R4A∨R4B) |
| RC12 | 2 | (R4C∨R4D) ∧ (R6A∨R6B∨R6C) |
| RC13 | 3 | (Q7C∨Q7D) ∧ Q14A |
| RC14 | 3 | (Q5C∨Q5D∨Q12C∨Q12D) ∧ Q14B |
| RC15 | 2 | (Q10C∨Q10D∨Q6B∨Q6C∨Q6D) ∧ Q14C |
| RC16 | 3 | (Q9B∨Q9C) ∧ Q14D |

Textes (thème, signaux, hypothèse, relance) : onglet « Règles combinées » du xlsx, extraits par le script §5.6.

---

## 12. Vérification (definition of done par lot)

- Lot 0 : `supabase start` + `pnpm dev` OK ; migrations reproductibles ; CI verte ; `docs/ARCHITECTURE.md` relu et validé par Jean-Luc.
- Scoring : `pnpm --filter scoring test` → 5 cas limites + 8 accessibilité + tie + invariant 7/7 verts.
- Lot 1–3 : e2e Playwright : parcours complet Dirigeant puis Rayonnement → résultat avant formulaire → lead → rapport → PDF → carte ; à 390/834/1440 ; double soumission neutralisée ; reprise après reload.
- Lot 4–6 : tests API RBAC (403 par rôle), dernier admin, invitation expirée ; renvoi sans recalcul.
- Lot 7 : DebugView/Test Events 14 tests ; axe 0 violation critique ; Lighthouse mobile ; `noindex` vérifié sur toutes routes sauf `/` ; aucun secret dans bundle client (`grep` sur `.output/public`) ; `SUPABASE_SERVICE_KEY` absent du client.
