# Radar by FeexPay

Web app mobile-first : profil du dirigeant (14 questions → 8 archétypes) et rayonnement de
l'entreprise (7 questions → score 0–100, niveau et météo). Résultat affiché **avant tout
formulaire**. Plan complet et décisions : [PLAN.md](PLAN.md). Sources normatives : `MarketingBS/`.

## Stack

Nuxt 4 (monolithe : public + API Nitro) · Supabase Postgres · `pg` en accès direct serveur ·
Tailwind 4 · Vitest · Resend et génération PDF en JavaScript pur (Lot 3, à venir).

Aucun navigateur sans interface, aucune file d'attente, aucun second serveur : tout tient dans
des fonctions éphémères, ce qui rend le déploiement Vercel possible sans dépendance externe.

## Arborescence

- `packages/scoring` — moteur pur V2.1, zéro dépendance. Données JSON extraites de la matrice,
  44 tests de contrôle. `public.ts` produit les projections d'affichage : le pilotage, les
  affinités, le tie-break et les hypothèses ne sortent jamais du serveur.
- `scripts/extract-matrix.ts` — xlsx → `packages/scoring/src/versions/v2.1/*.json` + checksum.
- `scripts/seed-scoring-version.ts` — seed idempotent de la version publiée en base.
- `supabase/migrations/` — schéma SQL, **source de vérité**.
- `server/api/public/` — sessions, participations, réponses, complétion, résultats, questions.
- `server/utils/` — accès base, jetons, session, erreurs, projections.
- `app/` — écrans P01–P09, composants `radar/*` et `ui/*`, composable `useParticipation`.
- `test/` — migration SQL sur PGlite (vitest) + smoke tests HTTP (scripts Node).

## Démarrer

`node` par défaut est en v10 sur le poste de développement : forcer la v22 avant tout `pnpm`.

```bash
nvm use 22
pnpm install
pnpm dev
```

Env : copier `.env.example` → `.env`. En local, `DATABASE_URL` utilise la connexion directe
Supabase (port 5432). Sur Vercel, elle doit pointer le **pooler Supavisor en mode session** :
la connexion directe est IPv6-only et les fonctions Vercel n'ont pas d'egress IPv6. La valeur
prête est dans `.env` sous `DATABASE_URL_POOLER`. Ne jamais utiliser le port 6543 (mode
transaction) : il ne supporte pas les prepared statements.

## Tests

```bash
pnpm test          # moteur (44) + migration SQL sur PGlite (9), sans base externe
pnpm test:api      # parcours HTTP : session, réponses, reprise, abandon (26 contrôles)
pnpm test:results  # calcul, snapshot, idempotence, cas normatifs §5.5 (14 contrôles)
```

Les deux derniers exigent un serveur lancé et écrivent dans la base pointée par
`DATABASE_URL`. Ils acceptent `APP_BASE_URL` pour viser un déploiement plutôt que localhost.

## Base de données

Le schéma est appliqué sur le projet Supabase en ligne : 21 tables, RLS activé sans policy sur
toutes (deny-all, accès service role uniquement), triggers d'immutabilité sur les snapshots,
l'historique des réponses et les versions publiées.

```bash
pnpm seed:scoring   # version 2.1 published + 21 questions + 84 options (idempotent)
```

Config Auth à faire au dashboard avant le Lot 4 : inscriptions publiques OFF, mot de passe
≥ 12 + HIBP, MFA TOTP ON.

## Règles

- Jetons publics : 32 octets aléatoires en base64url, stockés en sha256, jamais journalisés.
  Une participation n'est accessible qu'avec le cookie de session correspondant.
- Aucune donnée interne côté client : pilotage, affinités, constats et tie-break restent
  serveur. Vérifié par test sur la réponse de l'API.
- Aucune recommandation produit : le tag « Produit FeexPay » n'est pas extrait de la matrice.
- `noindex` partout sauf `/`.
- Interface : les valeurs de la maquette (annexe 02) priment sur le design system générique
  qu'elle embarque. Poppins est self-hosted, les icônes sont un sous-ensemble MDI en SVG — le
  design system interdit explicitement les emoji.
