#!/bin/bash
# Applique le schéma métier : les fichiers de supabase/migrations, dans l'ordre des noms,
# une fois chacun. Le SQL du dépôt reste la source de vérité — ce script ne fait que le
# poser, il n'en contient aucun.
#
# Il tourne dans un service à part, et non dans /docker-entrypoint-initdb.d, pour deux
# raisons : la première migration référence auth.users, qui n'existe qu'une fois GoTrue
# passé, et les scripts d'init ne sont rejoués qu'après suppression du volume, alors
# qu'une migration ajoutée doit s'appliquer à une base déjà remplie.
#
# Idempotent : chaque fichier appliqué est inscrit dans `schema_migration`. Relancer le
# service après avoir ajouté un fichier n'applique que celui-là.
set -euo pipefail

MIGRATIONS=${MIGRATIONS:-/migrations}
ATTENTE_MAX=${ATTENTE_MAX:-120}

psql_() { psql -v ON_ERROR_STOP=1 --quiet --no-psqlrc "$@"; }

echo "[migrer] base ${PGHOST}:${PGPORT:-5432}/${PGDATABASE}, migrations dans ${MIGRATIONS}"

# 1. La base répond.
for i in $(seq 1 "$ATTENTE_MAX"); do
  if pg_isready --quiet; then break; fi
  if [ "$i" = "$ATTENTE_MAX" ]; then echo "[migrer] base injoignable" >&2; exit 1; fi
  sleep 1
done

# 2. GoTrue a créé ses tables. La première migration pose une clé étrangère vers
#    auth.users : sans elle, tout échoue au premier fichier.
for i in $(seq 1 "$ATTENTE_MAX"); do
  if [ "$(psql_ -tAc "select to_regclass('auth.users') is not null")" = "t" ]; then break; fi
  if [ "$i" = "$ATTENTE_MAX" ]; then echo "[migrer] auth.users absente, GoTrue n'a pas migré" >&2; exit 1; fi
  sleep 1
done

# 3. Journal des migrations appliquées.
psql_ -c "create table if not exists schema_migration (
            nom text primary key,
            applique_le timestamptz not null default now()
          )"

# 4. Les fichiers, dans l'ordre des noms. Chacun porte son propre begin/commit : psql les
#    exécute tels quels, sans transaction englobante.
applique=0
for fichier in "$MIGRATIONS"/*.sql; do
  nom=$(basename "$fichier")
  deja=$(psql_ -tAc "select 1 from schema_migration where nom = '${nom//\'/\'\'}'")
  if [ "$deja" = "1" ]; then
    echo "[migrer] · $nom déjà appliquée"
    continue
  fi
  echo "[migrer] → $nom"
  psql_ -f "$fichier"
  psql_ -c "insert into schema_migration (nom) values ('${nom//\'/\'\'}')"
  applique=$((applique + 1))
done

# 5. Les tables sont créées par le superutilisateur : sans ces droits, le rôle que porte
#    la clé service ne voit rien à travers PostgREST. `bypassrls` lève la RLS, pas
#    l'absence de privilège. Rejoué à chaque passage, y compris pour les tables ajoutées.
psql_ <<'SQL'
grant usage on schema public to anon, authenticated, service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
-- PostgREST garde le schéma en cache : on le lui fait relire s'il tourne déjà.
select pg_notify('pgrst', 'reload schema');
SQL

echo "[migrer] terminé, $applique migration(s) appliquée(s)"
