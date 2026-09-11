#!/bin/sh
set -eu

# Écrit la table des tâches, dépose le jeton, puis laisse crond au premier plan.
#
# Les horaires reprennent ceux de vercel.json (3 h et 8 h) et s'expriment dans le fuseau
# du conteneur — TZ=UTC par défaut, comme sur Vercel. Le jeton ne passe pas par la table
# des tâches : crond ne transmet pas l'environnement du conteneur, et une ligne
# `VAR=valeur` n'est pas comprise par celui de BusyBox.

CRONTAB=${CRONTAB:-/etc/crontabs/root}
JETON=${JETON:-/run/radar/cron-secret}
ABANDON=${CRON_ABANDON:-0 3 * * *}
RELANCE=${CRON_RELANCE:-0 8 * * *}

if [ -z "${CRON_SECRET:-}" ]; then
  echo "[cron] CRON_SECRET absent : les routes /api/cron répondront 401." >&2
fi

mkdir -p "$(dirname "$JETON")" "$(dirname "$CRONTAB")"
umask 077
printf '%s' "${CRON_SECRET:-}" > "$JETON"

# `>> /proc/1/fd/1` : la sortie des tâches rejoint celle du conteneur, donc
# `docker compose logs cron`. crond, lui, l'enverrait à un sendmail absent.
{
  echo "${ABANDON} /usr/local/bin/tache abandon >> /proc/1/fd/1 2>&1"
  echo "${RELANCE} /usr/local/bin/tache relance >> /proc/1/fd/1 2>&1"
} > "$CRONTAB"

echo "[cron] tâches planifiées (TZ=${TZ:-UTC}) :"
cat "$CRONTAB"

# `-d 8` : niveau par défaut, mais journalisé sur la sortie d'erreur — il n'y a pas de
# syslog dans le conteneur.
exec crond -f -d 8
