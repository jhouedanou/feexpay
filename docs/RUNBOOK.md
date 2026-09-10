# Runbook d'exploitation — Radar by FeexPay

À quoi regarder, dans quel ordre, quand quelque chose ne va pas. Livrable H.2, PLAN.md §9
étape 18. Version du 10 septembre 2026.

Architecture et choix techniques : `docs/ARCHITECTURE.md`.

---

## 1. Première vérification, toujours

```bash
curl -s https://radar.feexpay.me/api/public/health | jq
```

```json
{
  "status": "ok",
  "scoringVersion": "2.2",
  "checksum": "a1b2c3d4e5f6",
  "db": { "status": "ok", "version": "2.2", "checksum": "a1b2c3d4e5f6" },
  "checksumMatch": true
}
```

| Ce que renvoie la sonde | Ce que cela veut dire | Quoi faire |
|---|---|---|
| `db.status: "not_configured"` | `SUPABASE_URL` ou `SUPABASE_SERVICE_KEY` manque | Variables d'environnement Vercel, puis redéployer. |
| `db.status: "unreachable"` | Base injoignable | §3. |
| `db.status: "no_published_version"` | Aucune version du moteur publiée en base | `pnpm seed:scoring`, ou publier depuis T01. |
| `checksumMatch: false` | La version publiée en base ne correspond pas au moteur déployé | §4. **Bloquant** : les résultats calculés ne correspondent plus à la matrice publiée. |

---

## 2. Variables d'environnement

Toutes dans Vercel, projet `radar`, portée Production. La référence est `.env.example`.

| Variable | Rôle | Effet si absente |
|---|---|---|
| `DATABASE_URL` | Postgres, **pooler Supavisor en mode session** | Rien ne fonctionne. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Authentification de l'administration, sonde | Administration inaccessible. |
| `SUPABASE_KEY` | Clé anonyme, connexion et rafraîchissement de session | Connexion administrateur impossible. |
| `RESEND_API_KEY` | Envoi des emails | Aucun email ne part ; les notifications passent `failed` avec la raison. |
| `RESEND_WEBHOOK_SECRET` | Signature des webhooks Resend | Les statuts restent figés à « Accepté » : ni remis, ni ouvert, ni rejeté. |
| `RESEND_FROM` | Expéditeur | Repli sur `onboarding@resend.dev`, qui ne délivre qu'au titulaire du compte Resend. |
| `CRON_SECRET` | Jeton des tâches planifiées | `/api/cron/abandon` refuse tout appel (403) : les parcours abandonnés ne sont plus clôturés. |
| `APP_BASE_URL` | Liens des emails | Les liens de rapport et d'invitation pointent `localhost`. |

Ne jamais mettre `DATABASE_URL` sur le port 6543 (pooler en mode transaction) : les requêtes
préparées de `pg` n'y fonctionnent pas.

---

## 3. Base injoignable

Symptôme : la sonde renvoie `db.status: "unreachable"`, ou les pages du parcours échouent
après la première question.

1. Tableau de bord Supabase : le projet est-il en pause ? Un projet gratuit se met en pause
   après inactivité prolongée. Le réactiver.
2. `DATABASE_URL` pointe-t-elle bien le pooler ? La connexion directe est IPv6 seulement, et
   les fonctions Vercel n'ont pas d'egress IPv6 : le symptôme est alors un `ENETUNREACH`
   dans les journaux Vercel.
3. Nombre de connexions : le pool est plafonné à 5 par instance (`server/utils/db.ts`).
   Beaucoup d'instances éphémères simultanées peuvent saturer le pooler. Regarder
   `Database → Connection pooling` chez Supabase.

Ce qui n'est pas perdu pendant une panne : les réponses déjà envoyées sont en base ; celles
saisies pendant la panne attendent dans le navigateur et partent au retour du réseau.

---

## 4. Le condensat du moteur ne correspond plus

`checksumMatch: false` signifie que le code déployé et la version publiée en base ne
décrivent pas la même matrice. Les résultats produits ne sont plus ceux qu'annonce la
version publiée.

1. Admin → **Versions du moteur** (T01) : quelle version est publiée, quel est son condensat ?
2. Comparer avec le condensat du code déployé, renvoyé par la sonde.
3. Si la base est en retard : republier la bonne version depuis T01, après avoir lancé les
   contrôles automatiques que l'écran propose.
4. Si le code est en retard : redéployer la bonne version du dépôt.

Les résultats déjà calculés ne bougent pas : chaque snapshot porte la version qui l'a
produit et il est immuable.

---

## 5. Les emails ne partent pas, ou restent « Accepté »

Admin → **Rapports et emails** (A07), colonne statut.

| Statut figé | Cause | Action |
|---|---|---|
| `failed` avec « RESEND_API_KEY absente » | Variable non posée | La poser, redéployer. |
| `failed` avec un message Resend | Adresse refusée, domaine non vérifié, quota | Lire le message dans le journal de l'envoi. Sans domaine vérifié, `onboarding@resend.dev` ne délivre qu'au titulaire du compte. |
| Toujours `accepted`, jamais `delivered` ni `opened` | Webhook Resend non configuré ou `RESEND_WEBHOOK_SECRET` absent | Déclarer `POST https://radar.feexpay.me/api/public/webhooks/resend` dans le tableau de bord Resend et poser le secret. |

Renvoyer un rapport : A07 → « Renvoyer ». Un nouveau jeton est émis et **l'ancien lien
devient invalide**. « Corriger et renvoyer » modifie d'abord l'adresse du contact.

Relance groupée des échecs : A07 → « Relancer les échecs ».

---

## 6. Les parcours abandonnés ne sont pas clôturés

Symptôme : le dashboard A02 montre un taux de complétion qui s'effondre, avec beaucoup de
parcours « en cours » anciens.

```bash
curl -s https://radar.feexpay.me/api/cron/abandon -H "Authorization: Bearer $CRON_SECRET"
# → { "traitees": 12, "correlation_id": "…" }
```

- `403 CRON_SECRET non configuré` : la variable manque côté Vercel.
- `401` : le jeton envoyé ne correspond pas.

La tâche planifiée tourne à 3 h UTC (`vercel.json`). Elle clôture les participations dont la
session de reprise a expiré, c'est-à-dire sept jours sans le moindre passage. Les réponses ne
sont pas touchées.

---

## 7. Le tracking ne remonte pas

D'abord : Admin → **Réglages**. `tracking_enabled` à `false` coupe tout, quel que soit le
consentement des visiteurs.

Ensuite, la file de sortie dit ce qui s'est passé côté serveur :

```sql
select event_name, targets, sent_at is not null as envoye, attempts, last_error
  from tracking_event_outbox
 order by created_at desc limit 20;
```

| `last_error` | Signification |
|---|---|
| `tracking désactivé` | `tracking_enabled` n'est pas à `true`. |
| `ga4_measurement_id ou ga4_api_secret absent` | Réglages GA4 incomplets. `report_generated` et `report_sent` ne remonteront pas. |
| `meta_pixel_id ou meta_capi_access_token absent` | Réglages Meta incomplets. |
| Un code HTTP et un extrait de réponse | Le fournisseur a refusé. Lire l'extrait. |

Les événements du navigateur (`page_view`, `quiz_start`, `form_start`…) ne passent pas par
cette table : ils partent de `gtag` et `fbq`, sous consentement. S'ils manquent alors que la
file est saine, regarder le bandeau de consentement et la console du navigateur (une
violation de CSP y apparaît explicitement).

---

## 8. Un administrateur ne peut plus se connecter

| Situation | Action |
|---|---|
| Mot de passe oublié | `/admin/mot-de-passe-oublie`. Lien valable une heure, à usage unique. Le second facteur reste exigé ensuite. |
| Second facteur perdu, codes de récupération disponibles | Écran 2FA → code de récupération. Le facteur TOTP est retiré, à ré-enrôler à la connexion suivante. |
| Second facteur et codes perdus | Un autre administrateur suspend puis réactive le compte, ou le réinvite. |
| « Trop de tentatives » | Verrouillage de 15 minutes après cinq échecs. Une réinitialisation réussie remet le compteur à zéro. |
| « Ce compte est suspendu ou révoqué » | Admin → Comptes → réactiver. |
| Dernier administrateur | Le dernier compte Administrateur actif ne peut être ni suspendu, ni révoqué, ni rétrogradé (garde en base). Créer d'abord un second administrateur. |

Toute réduction de privilèges coupe immédiatement les sessions ouvertes du compte visé.

---

## 9. Livrer une nouvelle version

```bash
nvm use 22
pnpm install
pnpm test          # moteur + migrations SQL, sans base externe
pnpm typecheck:app
pnpm dev &         # puis, serveur lancé :
pnpm test:api && pnpm test:results && pnpm test:leads
pnpm test:admin && pnpm test:metier && pnpm test:lot6 && pnpm test:reset
pnpm build
grep -r "SUPABASE_SERVICE_KEY\|DATABASE_URL\|api_secret" .output/public   # doit ne rien renvoyer
```

Il n'y a pas d'intégration continue : ces commandes sont le seul filet. Les six dernières
écrivent dans la base pointée par `DATABASE_URL` — ne jamais les lancer sur la production.

**Migrations.** Ajouter un fichier daté dans `supabase/migrations/`, jamais modifier un
fichier déjà appliqué. Le fichier est rejoué à chaque `pnpm test` sur une base en mémoire,
ce qui vérifie qu'il s'applique proprement. L'application sur le projet Supabase se fait à
la main, dans l'ordre des noms de fichiers.

**Régénérer le contrat d'API** après ajout ou suppression d'une route : `pnpm openapi`,
serveur de développement lancé.

---

## 10. Sauvegarde et restauration

Voir `docs/ARCHITECTURE.md` §8. En résumé : sauvegardes assurées par le plan Supabase,
restauration jamais testée à ce jour, RPO/RTO non contractualisés. Ces trois points sont
ouverts avant la mise en ligne.
