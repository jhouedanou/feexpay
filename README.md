# Radar by FeexPay

Web app mobile-first : profil du dirigeant (14 questions → 8 archétypes) et rayonnement de l'entreprise (7 questions → score 0–100, météo). Plan complet et décisions : [PLAN.md](PLAN.md). Sources normatives : `MarketingBS/`.

## Stack

Nuxt 3 (monolithe public + admin + API Nitro) · Supabase Postgres/Auth/Storage · Drizzle · pg-boss · Playwright (PDF) · Resend · Vitest.

## Arborescence

- `packages/scoring` — moteur pur V2.1 (zéro dépendance), données JSON extraites de la matrice, tests de contrôle.
- `scripts/extract-matrix.ts` — xlsx → `packages/scoring/src/versions/v2.1/*.json` + checksum.
- `supabase/migrations/` — schéma SQL, **source de vérité**. `server/db/schema.ts` = miroir Drizzle.
- `server/api/public/` — sessions, participations, réponses, complétion, résultats, questions.
- `app/` — pages P01–P09, composants `radar/*`, composable `useParticipation`.
- `test/` — migration (PGlite) + parcours API e2e (Nuxt réel sur PGlite socket).

## Démarrer

```bash
pnpm install
pnpm test            # scoring + migration + e2e API, sans DB externe
pnpm dev             # nécessite DATABASE_URL (Supabase, connexion directe 5432)
```

Env : copier `.env.example` → `.env`. Variables Nuxt : `NUXT_DATABASE_URL` (ou `DATABASE_URL`).

## Supabase (projet en ligne)

```bash
supabase link --project-ref <ref>
supabase db push                       # applique supabase/migrations
DATABASE_URL=postgres://... pnpm db:seed   # version 2.1 published + 21 questions + 84 options
```

Config Auth (dashboard) : inscriptions publiques OFF, mot de passe ≥ 12 + HIBP, MFA TOTP ON. Buckets privés : `reports`, `shares`, `exports`.

## Règles

- Jetons publics : 32 bytes random base64url, stockés sha256, jamais loggés.
- Aucune donnée interne côté client : pilotage, affinités, constats, tie-break restent serveur.
- Aucune recommandation produit : le tag « Produit FeexPay » n'est pas extrait.
- `noindex` partout sauf `/`.
