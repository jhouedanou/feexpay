# syntax=docker/dockerfile:1.7

# Les deux tâches planifiées. Sur Vercel, vercel.json les déclenche ; ici, c'est `crond`
# qui appelle les mêmes URL avec le même jeton. Aucun code applicatif : l'ordonnanceur
# n'est qu'un client HTTP.
FROM alpine:3.24

RUN apk add --no-cache curl tzdata
COPY entrypoint.sh /usr/local/bin/entrypoint
COPY tache.sh /usr/local/bin/tache
RUN chmod +x /usr/local/bin/entrypoint /usr/local/bin/tache

ENTRYPOINT ["entrypoint"]
