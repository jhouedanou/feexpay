#!/bin/sh
set -eu

# Une tâche planifiée : $1 est la route sous /api/cron (abandon, relance).
#
# Le jeton est lu dans un fichier, pas dans l'environnement : `crond` n'exporte que
# quelques variables aux tâches qu'il lance, celles du conteneur ne lui survivent pas.
# Le fichier est écrit au démarrage par entrypoint.sh, en 600.

route=$1
base=${APP_URL:-http://app:3000}
jeton=$(cat /run/radar/cron-secret 2>/dev/null || true)

horodatage=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
reponse=$(curl -fsS -m 300 -H "Authorization: Bearer ${jeton}" "${base}/api/cron/${route}" 2>&1) && etat=0 || etat=$?

if [ "$etat" -eq 0 ]; then
  echo "[cron] ${horodatage} ${route} : ${reponse}"
else
  echo "[cron] ${horodatage} ${route} : échec (curl ${etat}) ${reponse}" >&2
fi
exit 0
