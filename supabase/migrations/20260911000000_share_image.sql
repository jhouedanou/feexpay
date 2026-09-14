-- ---------------------------------------------------------------------------
-- Partage : image d'aperçu par résultat (PLAN.md §9 étape 14)
--
-- WhatsApp et LinkedIn ne savent recevoir qu'une URL : c'est la page visée qui doit
-- porter son image d'aperçu. Le navigateur dessine déjà la carte au bon format ; il
-- l'envoie désormais au serveur, qui la conserve et la ressert aux robots d'aperçu.
--
-- L'image est stockée en base plutôt que dans un service de fichiers : il n'y en a pas
-- dans ce déploiement, et une bannière pèse quelques centaines de kilo-octets.
-- ---------------------------------------------------------------------------

alter table share_asset
  add column if not exists image      bytea,
  add column if not exists image_type text,
  add column if not exists image_at   timestamptz,
  add column if not exists jeton      text;

create unique index if not exists share_asset_jeton_idx on share_asset (jeton) where jeton is not null;

-- Ce jeton-ci est conservé en clair, contrairement à ceux de participation et de rapport.
-- Il existe pour être publié : la page qu'il ouvre ne montre qu'un archétype ou un score,
-- sans nom, sans email, sans entreprise. Le régénérer à chaque partage casserait l'aperçu
-- des publications déjà faites, d'où sa stabilité.

-- Garde-fou : une image sans son type ne serait pas servable.
alter table share_asset drop constraint if exists share_asset_image_type_check;
alter table share_asset
  add constraint share_asset_image_type_check
  check (image is null or image_type is not null);
