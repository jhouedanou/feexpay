#!/bin/sh
set -eu

# Nitro ne relit à l'exécution que les variables préfixées `NUXT_` : `NUXT_DATABASE_URL`
# écrase `runtimeConfig.databaseUrl`, `NUXT_PUBLIC_APP_BASE_URL` écrase
# `runtimeConfig.public.appBaseUrl`. Le projet, lui, nomme ses variables d'après le CDC
# (`DATABASE_URL`, `APP_BASE_URL`…), et nuxt.config.ts ne les lit qu'à la compilation.
#
# Ce point d'entrée recopie les secondes dans les premières. Un seul jeu de noms suffit
# donc dans .env, sur Vercel et dans docker-compose.yml, et l'image se configure au
# démarrage au lieu d'être recompilée. Une variable `NUXT_` déjà posée n'est jamais
# écrasée : c'est le moyen de passer outre.

recopier() {
  cible=$1
  origine=$2
  eval "actuelle=\${$cible:-}"
  if [ -n "$actuelle" ]; then
    return 0
  fi
  eval "valeur=\${$origine:-}"
  if [ -n "$valeur" ]; then
    export "$cible=$valeur"
  fi
}

# Serveur (jamais exposé au navigateur).
recopier NUXT_SUPABASE_URL SUPABASE_URL
recopier NUXT_SUPABASE_SERVICE_KEY SUPABASE_SERVICE_KEY
recopier NUXT_DATABASE_URL DATABASE_URL
recopier NUXT_RESEND_API_KEY RESEND_API_KEY
recopier NUXT_RESEND_WEBHOOK_SECRET RESEND_WEBHOOK_SECRET
recopier NUXT_RESEND_FROM RESEND_FROM
recopier NUXT_MAIL_TRANSPORT MAIL_TRANSPORT
recopier NUXT_SMTP_URL SMTP_URL
recopier NUXT_MAIL_FROM MAIL_FROM
recopier NUXT_CRON_SECRET CRON_SECRET

# Public : ces valeurs partent dans le payload d'hydratation.
recopier NUXT_PUBLIC_APP_BASE_URL APP_BASE_URL
recopier NUXT_PUBLIC_SUPABASE_URL SUPABASE_URL
recopier NUXT_PUBLIC_SUPABASE_KEY SUPABASE_KEY
recopier NUXT_PUBLIC_GA4_MEASUREMENT_ID PUBLIC_GA4_MEASUREMENT_ID
recopier NUXT_PUBLIC_META_PIXEL_ID PUBLIC_META_PIXEL_ID
recopier NUXT_PUBLIC_TRACKING_ENABLED TRACKING_ENABLED

# Sans base, l'application démarre et répond sur /api/public/health, mais tout le reste
# échoue en 500. Un avertissement au démarrage évite de chercher ailleurs.
if [ -z "${NUXT_DATABASE_URL:-}" ]; then
  echo "[entrypoint] DATABASE_URL absente : les routes qui lisent la base répondront en erreur." >&2
fi
if [ -z "${NUXT_SUPABASE_URL:-}" ] || [ -z "${NUXT_SUPABASE_SERVICE_KEY:-}" ]; then
  echo "[entrypoint] SUPABASE_URL ou SUPABASE_SERVICE_KEY absente : l'espace admin refusera les connexions." >&2
fi

exec "$@"
