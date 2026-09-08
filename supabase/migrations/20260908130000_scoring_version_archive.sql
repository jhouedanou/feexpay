-- Publication de la matrice V2.2 : une version publiée doit pouvoir passer en `archived`
-- en gardant sa date de publication (le garde interdit de la modifier). L'ancienne
-- contrainte exigeait published_at nul hors publication, ce qui rendait l'archivage impossible.
alter table scoring_version drop constraint if exists scoring_version_check;
alter table scoring_version
  add constraint scoring_version_check
  check ((status = 'draft') = (published_at is null));
