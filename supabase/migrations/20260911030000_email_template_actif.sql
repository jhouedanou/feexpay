-- ---------------------------------------------------------------------------
-- Modèles d'email activables depuis l'admin (A07, bloc « Modèles actifs »)
--
-- Un modèle désactivé n'envoie plus d'email : le rapport est produit et reste lisible en
-- ligne, la notification est marquée « cancelled » avec le motif. Une ligne absente
-- signifie « texte d'origine, actif » ; la ligne peut désormais exister sans réécriture,
-- pour porter seulement la désactivation.
-- ---------------------------------------------------------------------------

alter table email_template add column if not exists actif boolean not null default true;
