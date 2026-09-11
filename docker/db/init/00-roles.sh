#!/bin/bash
# Rôles et schémas attendus par la couche API, posés au tout premier démarrage de la base
# (les scripts de /docker-entrypoint-initdb.d ne sont rejoués qu'après suppression du
# volume). Le schéma métier, lui, est appliqué plus tard par docker/db/migrer.sh : il
# référence auth.users, donc il doit attendre que GoTrue ait migré.
#
# Un seul mot de passe pour tous les rôles de service : ils ne sont joignables que depuis
# le réseau du compose. À séparer si la base est un jour exposée.
set -euo pipefail

# Les valeurs passent par des variables psql : `:'mdp'` les échappe comme littéral et
# `:"base"` comme identifiant, quels que soient les caractères du mot de passe.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
     -v mdp="$POSTGRES_PASSWORD" -v base="$POSTGRES_DB" <<SQL
-- Extensions attendues par le schéma métier, créées ici par le superutilisateur : les
-- migrations les redemandent en \`if not exists\`, et GoTrue n'a pas le droit d'en créer.
create extension if not exists pgcrypto;
create extension if not exists citext;

-- Les trois rôles de la convention Supabase. \`service_role\` contourne la RLS : c'est
-- lui que porte la clé service, et c'est ce qui permet à PostgREST de lire des tables
-- toutes en « deny-all ».
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

-- PostgREST se connecte avec ce rôle, puis prend celui que déclare le jeton.
create role authenticator login noinherit password :'mdp';
grant anon to authenticator;
grant authenticated to authenticator;
grant service_role to authenticator;

-- GoTrue se connecte avec celui-ci et crée lui-même ses tables. Le schéma \`auth\` est
-- créé d'avance et lui appartient ; le privilège \`create\` sur la base couvre le cas où
-- GoTrue le redemande à un démarrage suivant.
create role supabase_auth_admin login noinherit createrole password :'mdp';
create schema if not exists auth authorization supabase_auth_admin;
grant create on database :"base" to supabase_auth_admin;

grant usage on schema public to anon, authenticated, service_role;
SQL
