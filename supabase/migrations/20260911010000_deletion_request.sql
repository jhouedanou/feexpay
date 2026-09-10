-- ---------------------------------------------------------------------------
-- Demandes de suppression de données (RGPD, article 17)
--
-- Le produit promet « vous pouvez en demander la suppression à tout moment » sur
-- l'accueil, sur P10 et dans l'email du rapport, sans aucun moyen d'agir jusqu'ici.
--
-- Deux temps : la demande, puis sa confirmation par un lien reçu à l'adresse visée.
-- Sans ce second temps, n'importe qui pourrait déclencher l'effacement des données
-- d'un tiers en saisissant son adresse.
-- ---------------------------------------------------------------------------

create type deletion_status as enum ('pending', 'verified', 'done', 'rejected', 'expired');

create table deletion_request (
  id           uuid primary key default gen_random_uuid(),
  email        citext not null,
  -- Renseigné à la vérification seulement : avant, la demande ne dit rien de qui la fait.
  contact_id   uuid references contact(id) on delete set null,
  token_hash   text not null unique,
  status       deletion_status not null default 'pending',
  expires_at   timestamptz not null,
  verified_at  timestamptz,
  handled_at   timestamptz,
  handled_by   uuid references admin_user(id) on delete set null,
  motif        text,
  requested_ip inet,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Une seule demande en cours par adresse : une nouvelle périme la précédente.
create unique index deletion_request_ouverte_idx
  on deletion_request (email) where status in ('pending', 'verified');
create index deletion_request_file_idx on deletion_request (status, created_at);

create trigger trg_deletion_request_updated before update on deletion_request
  for each row execute function set_updated_at();

alter table deletion_request enable row level security;
alter table deletion_request force row level security;
revoke all on deletion_request from anon, authenticated;

-- L'email de confirmation est journalisé comme les autres envois.
alter table notification
  add column if not exists deletion_request_id uuid references deletion_request(id) on delete cascade;

alter table notification drop constraint if exists notification_origine_unique;
alter table notification
  add constraint notification_origine_unique
  check (num_nonnulls(report_id, admin_invitation_id, admin_password_reset_id, deletion_request_id) = 1);
