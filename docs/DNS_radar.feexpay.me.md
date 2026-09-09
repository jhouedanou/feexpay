# Dossier DNS — radar.feexpay.me

À transmettre au point focal FeexPay qui administre la zone `feexpay.me`. Aucun accès direct
au DNS n'est prévu côté Big Five : les valeurs ci-dessous sont à créer telles quelles.

## 1. Site

Hébergement de l'application sur Vercel (projet Big Five). Un seul enregistrement :

| Type | Nom | Valeur | TTL |
|---|---|---|---|
| CNAME | `radar` | `cname.vercel-dns.com.` | 3600 |

Le certificat TLS est émis automatiquement une fois le CNAME propagé. Vercel fournira, si
la zone refuse le CNAME, un enregistrement A de remplacement (`76.76.21.21`).

## 2. Envoi des emails (Resend)

Les rapports partent depuis l'adresse `radar@feexpay.me` (expéditeur affiché « Radar by
FeexPay »). Resend exige la vérification du domaine ou d'un sous-domaine. Recommandation :
vérifier le **sous-domaine** `radar.feexpay.me` comme domaine d'envoi, pour ne toucher ni au
SPF ni au DMARC existants de `feexpay.me`.

Les valeurs exactes (sélecteur DKIM et clé publique) sont générées par Resend à l'ajout du
domaine. Elles seront envoyées au point focal dans un second message ; la forme attendue :

| Type | Nom | Valeur | Rôle |
|---|---|---|---|
| TXT | `radar` | `v=spf1 include:amazonses.com ~all` | SPF |
| TXT | `resend._domainkey.radar` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ…` | DKIM |
| MX | `radar` | `feedback-smtp.eu-west-1.amazonses.com` priorité 10 | retours (bounces) |
| TXT | `_dmarc.radar` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@feexpay.me; adkim=s; aspf=s` | DMARC |

Si FeexPay préfère un expéditeur sur le domaine racine (`radar@feexpay.me` avec SPF du
domaine), il faut alors ajouter `include:amazonses.com` au SPF existant de `feexpay.me` et
créer `resend._domainkey.feexpay.me` : à arbitrer avec le point focal, l'option
sous-domaine reste la plus sûre.

## 3. Après création des enregistrements

1. Big Five vérifie le domaine dans Resend (propagation : quelques minutes à 24 h).
2. `RESEND_FROM` passe sur `Radar by FeexPay <radar@radar.feexpay.me>` (ou
   `radar@feexpay.me` selon l'option retenue), `APP_BASE_URL` sur `https://radar.feexpay.me`.
3. Le webhook Resend est déclaré sur `https://radar.feexpay.me/api/public/webhooks/resend`
   (événements delivered, opened, bounced, complained, delivery_delayed) et son secret
   renseigné dans `RESEND_WEBHOOK_SECRET`.
4. Un envoi de test est fait vers une adresse FeexPay et contrôlé dans A07 (statut « Remis »).

## 4. Tracking

Rien à faire côté DNS : GA4 et le Pixel Meta sont chargés par l'application après
consentement, la Conversions API est appelée côté serveur. Le domaine `radar.feexpay.me`
est à ajouter dans la propriété GA4 (flux web) et dans le domaine vérifié Meta Business si
FeexPay souhaite l'attribution de domaine.
