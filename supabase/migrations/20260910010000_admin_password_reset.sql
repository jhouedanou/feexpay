-- ---------------------------------------------------------------------------
-- Lot 7 — réinitialisation du mot de passe administrateur (PLAN.md §10.5)
--
-- Les codes de récupération ne couvrent que le second facteur : un administrateur
-- qui perd son mot de passe était bloqué, sans autre issue qu'une intervention
-- manuelle sur le tableau de bord du fournisseur d'authentification.
--
-- Table dédiée plutôt que réemploi d'`admin_invitation` : les deux objets n'ont ni
-- le même cycle de vie ni les mêmes contraintes, et l'unique partiel sur les
-- invitations en attente entrerait en conflit avec une invitation réelle.
-- ---------------------------------------------------------------------------

create table if not exists admin_password_reset (
  id            uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references admin_user(id) on delete cascade,
  token_hash    text not null unique,
  expires_at    timestamptz not null,
  used_at       timestamptz,
  requested_ip  inet,
  created_at    timestamptz not null default now()
);

-- Les demandes en cours d'un compte, pour les invalider quand l'une aboutit.
create index if not exists admin_password_reset_user_idx
  on admin_password_reset (admin_user_id) where used_at is null;

alter table admin_password_reset enable row level security;
alter table admin_password_reset force row level security;
revoke all on admin_password_reset from anon, authenticated;

-- L'email de réinitialisation est journalisé comme les autres envois. La contrainte
-- d'origine n'admettait que deux origines possibles ; elle en admet trois désormais,
-- toujours exactement une par ligne.
alter table notification
  add column if not exists admin_password_reset_id uuid references admin_password_reset(id) on delete cascade;

alter table notification drop constraint if exists notification_check;
alter table notification
  add constraint notification_origine_unique
  check (num_nonnulls(report_id, admin_invitation_id, admin_password_reset_id) = 1);
