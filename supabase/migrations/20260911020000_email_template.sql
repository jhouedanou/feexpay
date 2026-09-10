-- ---------------------------------------------------------------------------
-- Modèles d'email modifiables depuis l'admin (A07 « Modèles d'email »)
--
-- Les textes de l'email de rapport étaient figés dans le code. Cette table porte, par
-- modèle, les champs qu'un administrateur a réécrits : sujet, titre, salutation,
-- introduction, libellé du bouton, mention et pied. Une ligne absente signifie « texte
-- d'origine » ; les valeurs par défaut restent dans le code, qui reste la référence.
--
-- Les champs sont en jsonb plutôt qu'en colonnes : la liste des champs évolue avec le
-- gabarit, et le serveur ne lit que ceux qu'il connaît.
-- ---------------------------------------------------------------------------

create table if not exists email_template (
  cle        text primary key check (cle in ('dirigeant', 'rayonnement', 'croise')),
  champs     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_user(id) on delete set null
);

alter table email_template enable row level security;
alter table email_template force row level security;
revoke all on email_template from anon, authenticated;
