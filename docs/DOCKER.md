# Pile Docker — Radar by FeexPay

Variante d'exécution : l'application et tout ce dont elle dépend tournent en conteneurs, sans
compte hébergé. Le déploiement de référence reste Vercel + Supabase, décrit dans
[ARCHITECTURE.md](ARCHITECTURE.md) ; ce document décrit la seconde façon de faire tourner le
même code, utile pour travailler hors ligne, pour monter une recette jetable, ou pour héberger
l'ensemble sur une machine louée.

> **Rien de ceci n'a été exécuté.** La pile a été écrite sans Docker sur le poste de
> développement, à la demande. Les versions d'images sont épinglées sur celles que Supabase
> fait tourner ensemble, la configuration suit leur documentation, et les deux parties
> vérifiables sans Docker l'ont été : le serveur compilé démarre par `docker/app/entrypoint.sh`
> et répond sur `/api/public/health`, avec la configuration lue à l'exécution. Le premier
> `docker compose up` demandera probablement des ajustements ; §7 liste les endroits les plus
> probables.

---

## 1. Ce que contient la pile

| Service | Image | Remplace | Rôle |
|---|---|---|---|
| `app` | construite ici | Fonctions Vercel | Nuxt/Nitro : pages P01–P14, espace admin, `/api/**` |
| `db` | `postgres:17-alpine` | Supabase Postgres | Les 28 tables de `supabase/migrations/` |
| `auth` | `supabase/gotrue:v2.196.0` | Supabase Auth | Mots de passe, sessions, TOTP, claim `aal` |
| `rest` | `postgrest/postgrest:v14.17` | Supabase REST | Lu par `/api/public/health` |
| `gateway` | `nginx:1.31-alpine` | Passerelle Supabase | Une origine pour `/auth/v1` et `/rest/v1` |
| `migrer` | `postgres:17-alpine` | Migrations à la main | Applique le SQL du dépôt, puis s'arrête |
| `cron` | construite ici | Vercel Cron | Appelle `/api/cron/abandon` et `/api/cron/relance` |
| `mail` | `axllent/mailpit:v1.31.1` | Resend | Reçoit tout le courrier, n'en délivre aucun |
| `outils` | construite ici | `pnpm` sur le poste | Seeds et tests HTTP, profil `outils` |

L'application est un monolithe : le conteneur `app` sert aussi bien l'API que les pages. Le
découpage ci-dessus ne concerne que ce qui était, jusqu'ici, fourni par des services hébergés.

La passerelle existe parce que `@supabase/supabase-js` construit ses URL à partir d'une seule
origine : `SUPABASE_URL/auth/v1/…` pour l'authentification, `SUPABASE_URL/rest/v1/…` pour les
tables. nginx route les deux préfixes vers les deux services ; c'est le rôle que Kong tient
dans la pile Supabase auto-hébergée.

## 2. Démarrer

```bash
cp docker/.env.example docker/.env
node docker/scripts/generer-secrets.mjs >> docker/.env
docker compose --env-file docker/.env up -d --build
```

`--env-file` n'est pas facultatif. Sans lui, Compose lirait le `.env` du dépôt, qui vise le
projet Supabase en ligne. Les variables exigées y étant absentes, il refuse de démarrer plutôt
que de mélanger les deux environnements. Pour s'en passer dans un terminal :

```bash
export COMPOSE_ENV_FILES=docker/.env
```

L'application écoute sur <http://localhost:3000>, la boîte de réception sur
<http://localhost:8025>, la passerelle sur <http://localhost:8000>.

Le premier démarrage enchaîne : création de la base et des rôles, migration de GoTrue,
application du schéma métier par `migrer`, démarrage de PostgREST puis de l'application. Les
dépendances sont déclarées dans `docker-compose.yml`, il n'y a rien à ordonner à la main.

### Les secrets

`docker/scripts/generer-secrets.mjs` produit cinq valeurs. Les deux « clés Supabase » ne sont
pas des clés au sens d'un fournisseur : ce sont des jetons JWT signés avec `JWT_SECRET` et
portant un rôle Postgres dans le claim `role`. PostgREST lit ce rôle pour décider sous quelle
identité exécuter la requête ; GoTrue reconnaît `service_role` comme rôle d'administration.
C'est exactement la mécanique de Supabase hébergé, d'où des clés de même forme.

Changer `JWT_SECRET` invalide les deux clés : les régénérer ensemble.

## 3. Amorçer les données

Comme sur Supabase, une base vide ne suffit pas : il faut la version du moteur publiée et au
moins un compte admin.

```bash
docker compose --env-file docker/.env --profile outils run --rm outils pnpm seed:scoring
docker compose --env-file docker/.env --profile outils run --rm outils pnpm tsx scripts/seed-admins.ts
```

Le second imprime les liens d'invitation à usage unique. Sur cette pile, les emails partent
aussi : ils sont lisibles dans Mailpit, les liens n'ont pas besoin d'être recopiés à la main.

## 4. Exploitation

```bash
docker compose --env-file docker/.env ps                  # état et santé des services
docker compose --env-file docker/.env logs -f app         # journal de l'application
docker compose --env-file docker/.env logs cron           # sortie des tâches planifiées
docker compose --env-file docker/.env restart app
docker compose --env-file docker/.env down                # arrêt, volume conservé
docker compose --env-file docker/.env down -v             # arrêt et suppression des données
```

**Migration ajoutée.** Déposer le fichier dans `supabase/migrations/` puis relancer le seul
service `migrer` : il applique ce qui manque et ne rejoue rien.

```bash
docker compose --env-file docker/.env up migrer
```

Le suivi vit dans la table `schema_migration`. Les scripts de `docker/db/init/`, eux, ne sont
joués qu'à la création du volume : une modification n'a d'effet qu'après `down -v`.

**Tâches planifiées à la demande.** Les deux routes sont de simples GET authentifiés :

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/relance
```

**Sauvegarde et restauration.**

```bash
docker compose --env-file docker/.env exec db pg_dump -U postgres -Fc radar > radar.dump
docker compose --env-file docker/.env exec -T db pg_restore -U postgres -d radar --clean < radar.dump
```

La sauvegarde couvre le schéma `auth` en plus du schéma métier : les comptes admin sont dans
le même fichier, contrairement au déploiement hébergé où ils vivent chez Supabase.

**Tests HTTP.** Ceux de `test/` visent un serveur en marche et écrivent dans la base pointée
par `DATABASE_URL` ; sur cette pile, aucune donnée réelle n'est en jeu.

```bash
docker compose --env-file docker/.env --profile outils run --rm \
  -e APP_BASE_URL=http://app:3000 outils pnpm test:api
```

## 5. Ce que la pile a changé dans le code

Trois points, tous inoffensifs pour le déploiement Vercel :

- **`server/utils/db.ts`** — TLS reste posé par défaut, sans vérification du certificat, comme
  l'exige Supabase. Un Postgres de conteneur écoute en clair et rejette la poignée de main :
  `sslmode=disable` dans l'URL coupe TLS. Même règle dans `scripts/env.ts` pour les seeds.
- **`server/utils/mailer.ts`** — les cinq envois passaient chacun par Resend. Ils passent
  maintenant par `expedier()`, qui choisit entre Resend et SMTP selon `MAIL_TRANSPORT`. Sans
  cette variable, rien ne change : le transport reste Resend, avec les mêmes messages d'erreur
  dans `notification.last_error`.
- **`docker/app/entrypoint.sh`** — Nitro ne relit à l'exécution que les variables préfixées
  `NUXT_`, alors que le projet nomme les siennes d'après le CDC. Le point d'entrée recopie
  `DATABASE_URL` dans `NUXT_DATABASE_URL`, `APP_BASE_URL` dans `NUXT_PUBLIC_APP_BASE_URL`, et
  ainsi de suite. C'est ce qui permet à une image compilée une fois de servir partout : sans
  cette recopie, les valeurs figées au build resteraient celles de la compilation. Une variable
  `NUXT_` déjà posée n'est jamais écrasée, ce qui laisse le dernier mot à l'opérateur.

`scripts/env.ts` rassemble par ailleurs le chargement de `.env` que les deux scripts de seed
dupliquaient, et rend le fichier facultatif : dans un conteneur, tout arrive par
l'environnement.

## 6. Différences avec le déploiement hébergé

| Point | Vercel + Supabase | Pile Docker |
|---|---|---|
| Base | Supabase Postgres 17, sauvegardes gérées | Volume `donnees-db`, sauvegardes à la charge de l'exploitant |
| Connexion base | Pooler Supavisor en mode session, TLS | Connexion directe au conteneur, en clair sur le réseau interne |
| Comptes admin | Supabase Auth | GoTrue dans le même volume que la base |
| Email | Resend, délivre vraiment | Mailpit, ne délivre rien |
| Tâches planifiées | `vercel.json` | `crond` dans le conteneur `cron` |
| TLS public | Fourni par Vercel | Aucun : à placer devant (§7) |
| Journalisation | Console Vercel | `docker compose logs` |

Le contrôle HIBP des mots de passe (CDC E.1) et les envois GA4 et Meta sortent sur Internet
dans les deux cas. Hors ligne, le contrôle HIBP échoue silencieusement et seule la longueur
minimale est vérifiée — c'est le comportement déjà prévu dans `verifierMotDePasse`.

## 7. Limites et points de vigilance

1. **Aucun HTTPS.** En production, placer un terminateur TLS devant `app` (Caddy, Traefik, ou
   le reverse proxy de l'hébergeur) et régler `APP_BASE_URL` sur l'URL publique. Le cookie de
   session admin est posé avec `Secure` : les navigateurs l'acceptent sur `http://localhost`,
   mais **pas** sur une adresse IP de réseau local. Tester l'admin depuis `localhost`, ou
   monter TLS.
2. **Un seul mot de passe Postgres** pour le superutilisateur, `authenticator` et
   `supabase_auth_admin`. Acceptable tant que la base n'est joignable que depuis le réseau du
   compose ; à séparer si le port 5432 est publié ailleurs que sur la machine de travail.
3. **Le port 5432 est publié** sur la machine hôte pour permettre `psql`. Le retirer, ou
   changer `POSTGRES_PORT`, si la machine n'est pas de confiance.
4. **Versions des images.** `supabase/gotrue:v2.196.0` et `postgrest/postgrest:v14.17` sont le
   couple que Supabase fait tourner ensemble. Monter de version l'une sans l'autre est le
   premier endroit où regarder en cas de comportement inattendu sur les sessions ou le TOTP.
5. **Si `migrer` échoue**, `rest` et `app` ne démarrent pas : c'est voulu, une application
   branchée sur une base à moitié migrée est pire qu'une application arrêtée. Le journal du
   service dit quel fichier a échoué (`docker compose logs migrer`).
6. **Si l'admin refuse la connexion**, vérifier dans l'ordre : `JWT_SECRET` identique pour
   `auth` et `rest`, clés régénérées après changement du secret, et `auth` en bonne santé
   (`docker compose ps`).
7. **Sauvegardes.** Rien n'est automatique. Sur une machine louée, ajouter une tâche qui joue
   le `pg_dump` du §4 et emporte le fichier ailleurs.

## 8. Héberger la pile ailleurs

Le fichier convient tel quel à un VPS ou à un hébergeur qui lit un `docker-compose.yml`
(Coolify, Dokploy, Portainer). À changer dans `docker/.env` :

```
APP_BASE_URL=https://radar.exemple.fr
SUPABASE_URL_PUBLIC=https://radar.exemple.fr   # si la passerelle est exposée, sinon laisser
MAIL_TRANSPORT=resend
RESEND_API_KEY=…
TZ=UTC
```

Puis retirer la publication du port 5432, placer le terminateur TLS devant `app`, et garder
`gateway` sur le réseau interne : rien, dans l'application, ne demande au navigateur de la
joindre.

Pour n'utiliser que le conteneur applicatif en gardant Supabase hébergé — l'autre découpage
possible — il suffit de lancer le seul service `app` avec les variables du `.env` du dépôt,
`sslmode=disable` en moins. `db`, `auth`, `rest`, `gateway` et `migrer` deviennent inutiles.
