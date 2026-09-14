-- ---------------------------------------------------------------------------
-- Lot 7 — GA4 Measurement Protocol côté serveur (PLAN.md §8)
-- `report_generated` et `report_sent` ne peuvent pas partir du navigateur : ils
-- surviennent après lui. Le Measurement Protocol exige un secret d'API distinct de
-- l'identifiant de mesure, à saisir dans Réglages comme les autres jetons.
-- ---------------------------------------------------------------------------

insert into app_setting (key, value, secret) values
  ('ga4_api_secret', '', true)
on conflict (key) do nothing;
