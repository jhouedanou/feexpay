# syntax=docker/dockerfile:1.7

# Serveur de l'application : Nuxt est un monolithe, ce conteneur sert donc aussi bien
# l'API `/api/**` que les pages P01–P14 et l'espace admin. Trois étapes : dépendances,
# compilation, exécution. L'image finale ne porte que `.output`, produit par Nitro et
# autonome — ni sources, ni node_modules, ni pnpm.
#
# Rien n'est figé au build côté configuration : les secrets et les URL sont lus à chaque
# démarrage (voir entrypoint.sh). La même image sert donc au développement et à la
# production, seul l'environnement change.

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Corepack installe la version de pnpm déclarée dans package.json. Sans cette variable il
# demande confirmation avant de la télécharger, et la construction s'arrête faute de terminal.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# --- Dépendances -------------------------------------------------------------
# Seuls les manifestes sont copiés : tant que le lockfile ne bouge pas, cette couche est
# réutilisée. `--ignore-scripts` écarte le postinstall du projet (`nuxt prepare`), qui
# exige les sources ; `pnpm rebuild` le rattrape à l'étape suivante pour esbuild.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/scoring/package.json packages/scoring/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# --- Compilation -------------------------------------------------------------
# NODE_ENV=production pose la CSP et HSTS (nuxt.config.ts) ; NITRO_PRESET fixe la cible,
# sans quoi Nitro la déduirait de la plateforme.
FROM deps AS build
COPY . .
ENV NODE_ENV=production
ENV NITRO_PRESET=node_server
RUN pnpm rebuild && pnpm build

# --- Outils ------------------------------------------------------------------
# Sources et dépendances de développement conservées : `pnpm seed:scoring`,
# `pnpm tsx scripts/seed-admins.ts` et les tests HTTP de `test/` tournent ici.
# Service `outils` du docker-compose, profil `outils`.
FROM build AS outils
ENV NODE_ENV=development
CMD ["pnpm", "seed:scoring"]

# --- Exécution ---------------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
WORKDIR /app

COPY --from=build /app/.output ./.output
COPY docker/app/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint \
 && addgroup -S radar && adduser -S -G radar radar \
 && chown -R radar:radar /app

USER radar
EXPOSE 3000

# La sonde de socle : elle répond même sans base, ce qui distingue « serveur mort » de
# « base injoignable » dans `docker compose ps`.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/public/health >/dev/null || exit 1

ENTRYPOINT ["entrypoint"]
CMD ["node", ".output/server/index.mjs"]
