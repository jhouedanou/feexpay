-- Radar by FeexPay — schéma initial (CDC V1.1 §F.2, PLAN.md §4)
-- Source de vérité : ce fichier. Drizzle lit le schéma via `drizzle-kit pull`.
-- Toutes les tables métier : RLS activé + forcé, aucune policy => accès service role uniquement.

begin;

-- ---------------------------------------------------------------------------
-- 0. Extensions, enums, helpers
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists citext;

create type diagnostic_type      as enum ('dirigeant', 'rayonnement');
create type version_status       as enum ('draft', 'published', 'archived');
create type participation_status as enum ('in_progress', 'completed', 'abandoned');
create type notification_status  as enum ('queued', 'generated', 'accepted', 'delivered', 'opened', 'bounced', 'failed', 'cancelled');
create type report_status        as enum ('pending', 'ready', 'revoked');
create type admin_role           as enum ('lecture', 'commercial', 'analyste', 'admin');
create type admin_status         as enum ('invited', 'active', 'suspended', 'revoked');
create type invitation_status    as enum ('pending', 'accepted', 'expired', 'revoked');
create type share_format         as enum ('1080x1350', '1080x1080', '1200x630', '1080x1920');
create type cross_code           as enum ('CC', 'PS', 'RT', 'FR');
create type job_status           as enum ('queued', 'running', 'done', 'failed');

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function forbid_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'IMMUTABLE_ROW: % on %', tg_op, tg_table_name using errcode = 'restrict_violation';
end $$;

-- ---------------------------------------------------------------------------
-- 1. Référentiel scoring (versionné)
-- ---------------------------------------------------------------------------
create table scoring_version (
  id            uuid primary key default gen_random_uuid(),
  version       text not null unique,                  -- ex. '2.1'
  status        version_status not null default 'draft',
  checksum      text not null,                         -- sha256 des JSON v2.1
  published_at  timestamptz,
  author_id     uuid,                                  -- FK admin_user posée plus bas
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check ((status = 'published') = (published_at is not null))
);
create trigger trg_scoring_version_updated before update on scoring_version
  for each row execute function set_updated_at();

-- Version publiée = gelée. Seul changement autorisé : published -> archived (rollback = réactivation archived -> published).
create or replace function guard_scoring_version() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'VERSION_LOCKED: only draft versions can be deleted';
    end if;
    return old;
  end if;
  if old.status in ('published', 'archived') then
    if new.version <> old.version or new.checksum <> old.checksum or new.published_at is distinct from old.published_at then
      raise exception 'VERSION_LOCKED: published/archived version is immutable';
    end if;
    if new.status = 'draft' then
      raise exception 'VERSION_LOCKED: cannot revert to draft';
    end if;
  end if;
  return new;
end $$;
create trigger trg_scoring_version_guard before update or delete on scoring_version
  for each row execute function guard_scoring_version();

-- Une seule version publiée à la fois
create unique index scoring_version_one_published on scoring_version ((true)) where status = 'published';

create table question (
  id              uuid primary key default gen_random_uuid(),
  version_id      uuid not null references scoring_version(id) on delete cascade,
  code            text not null,                       -- Q1..Q14, R1..R7
  diagnostic_type diagnostic_type not null,
  ordre           smallint not null,
  texte           text not null,
  created_at      timestamptz not null default now(),
  unique (version_id, code),
  unique (version_id, diagnostic_type, ordre),
  check (code ~ '^(Q([1-9]|1[0-4])|R[1-7])$')
);

create table "option" (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references question(id) on delete cascade,
  code        text not null,                           -- Q1A, R3D…
  lettre      char(1) not null check (lettre in ('A','B','C','D')),
  texte       text not null,
  -- dim2, dim1, points, poids, applicable, tags[], nature, gravite, constat_* (validé par le moteur, archive ici)
  mapping     jsonb not null,
  created_at  timestamptz not null default now(),
  unique (question_id, code),
  unique (question_id, lettre)
);

-- ---------------------------------------------------------------------------
-- 2. Sessions anonymes, acquisition first-touch
-- ---------------------------------------------------------------------------
create table anonymous_session (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,                    -- sha256(base64url(32 bytes))
  expires_at  timestamptz not null,
  last_seen_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index anonymous_session_expires_idx on anonymous_session (expires_at);

create table acquisition (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null unique references anonymous_session(id) on delete cascade, -- 1 par session => first-touch garanti
  landing_url  text,
  referrer     text,
  utm_source   text, utm_medium text, utm_campaign text, utm_term text, utm_content text,
  fbclid       text,
  gclid        text,
  device       text,
  created_at   timestamptz not null default now()
);
create trigger trg_acquisition_immutable before update or delete on acquisition
  for each row execute function forbid_mutation();

-- ---------------------------------------------------------------------------
-- 3. Contacts (prospects)
-- ---------------------------------------------------------------------------
create table contact (
  id             uuid primary key default gen_random_uuid(),
  prenom         text not null,
  nom            text not null,
  email_norm     citext not null unique,
  phone_e164     text,
  entreprise     text,
  secteur        text,
  secteur_autre  text,
  taille         text,
  pays           text,
  match_conflict jsonb,                                -- {phone_seen: ..., at: ...} quand email ≠ phone existant ; jamais de fusion auto
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{6,14}$')
);
create index contact_phone_idx on contact (phone_e164) where phone_e164 is not null;
create trigger trg_contact_updated before update on contact
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Participations, réponses
-- ---------------------------------------------------------------------------
create table participation (
  id                      uuid primary key default gen_random_uuid(),
  session_id              uuid not null references anonymous_session(id) on delete restrict,
  contact_id              uuid references contact(id) on delete restrict,
  diagnostic_type         diagnostic_type not null,
  version_id              uuid not null references scoring_version(id) on delete restrict,
  status                  participation_status not null default 'in_progress',
  token_hash              text not null unique,
  parent_participation_id uuid references participation(id) on delete set null,
  started_at              timestamptz not null default now(),
  completed_at            timestamptz,
  duration_s              integer,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check ((status = 'completed') = (completed_at is not null)),
  check (duration_s is null or duration_s >= 0)
);
create index participation_session_idx on participation (session_id, diagnostic_type, status);
create index participation_contact_idx on participation (contact_id) where contact_id is not null;
create index participation_completed_idx on participation (completed_at desc) where status = 'completed';
create trigger trg_participation_updated before update on participation
  for each row execute function set_updated_at();

create table answer (
  id               uuid primary key default gen_random_uuid(),
  participation_id uuid not null references participation(id) on delete cascade,
  question_id      uuid not null references question(id) on delete restrict,
  option_id        uuid not null references "option"(id) on delete restrict,
  answered_at      timestamptz not null default now(),
  revised_at       timestamptz,
  unique (participation_id, question_id)
);

create table answer_history (
  id               uuid primary key default gen_random_uuid(),
  answer_id        uuid not null references answer(id) on delete cascade,
  participation_id uuid not null references participation(id) on delete cascade,
  question_id      uuid not null references question(id) on delete restrict,
  option_id        uuid not null references "option"(id) on delete restrict,
  recorded_at      timestamptz not null default now()
);
create index answer_history_answer_idx on answer_history (answer_id, recorded_at);
create trigger trg_answer_history_immutable before update or delete on answer_history
  for each row execute function forbid_mutation();

-- Toute écriture sur answer journalisée
create or replace function log_answer_history() returns trigger
language plpgsql as $$
begin
  insert into answer_history (answer_id, participation_id, question_id, option_id)
  values (new.id, new.participation_id, new.question_id, new.option_id);
  return new;
end $$;
create trigger trg_answer_history after insert or update of option_id on answer
  for each row execute function log_answer_history();

-- Cohérence option ↔ question
create or replace function check_answer_option() returns trigger
language plpgsql as $$
begin
  if not exists (select 1 from "option" o where o.id = new.option_id and o.question_id = new.question_id) then
    raise exception 'INVALID_ANSWER: option does not belong to question';
  end if;
  return new;
end $$;
create trigger trg_answer_option_check before insert or update on answer
  for each row execute function check_answer_option();

-- ---------------------------------------------------------------------------
-- 5. Snapshots (immuables, 1 par participation complétée)
-- ---------------------------------------------------------------------------
create table score_snapshot (
  id               uuid primary key default gen_random_uuid(),
  participation_id uuid not null unique references participation(id) on delete restrict,
  version_id       uuid not null references scoring_version(id) on delete restrict,
  scores           jsonb not null,                     -- raw, norm, affinités / dims rayonnement, pilotage (interne)
  result           jsonb not null,                     -- archétype principal/secondaire ou score+niveau+météo+nuance
  tie_break        jsonb,
  created_at       timestamptz not null default now()
);
create trigger trg_score_snapshot_immutable before update or delete on score_snapshot
  for each row execute function forbid_mutation();

create table insight_snapshot (
  id               uuid primary key default gen_random_uuid(),
  participation_id uuid not null unique references participation(id) on delete restrict,
  version_id       uuid not null references scoring_version(id) on delete restrict,
  items            jsonb not null,                     -- {facts, difficulties, forces, hypotheses, proofs}
  created_at       timestamptz not null default now(),
  check (not (items ? 'product') and not (items ? 'recommended_offer'))
);
create trigger trg_insight_snapshot_immutable before update or delete on insight_snapshot
  for each row execute function forbid_mutation();

-- ---------------------------------------------------------------------------
-- 6. Lecture croisée
-- ---------------------------------------------------------------------------
create table cross_reading (
  id                           uuid primary key default gen_random_uuid(),
  contact_id                   uuid not null references contact(id) on delete restrict,
  participation_dirigeant_id   uuid not null references participation(id) on delete restrict,
  participation_rayonnement_id uuid not null references participation(id) on delete restrict,
  code                         cross_code not null,
  pilotage                     numeric(8,4) not null,
  rayonnement                  numeric(8,4) not null,
  ecart                        numeric(8,4) not null,
  qualificatif                 text not null,
  created_at                   timestamptz not null default now(),
  unique (participation_dirigeant_id, participation_rayonnement_id)
);
create index cross_reading_contact_idx on cross_reading (contact_id);

create or replace function check_cross_reading_types() returns trigger
language plpgsql as $$
begin
  if (select diagnostic_type from participation where id = new.participation_dirigeant_id) <> 'dirigeant'
     or (select diagnostic_type from participation where id = new.participation_rayonnement_id) <> 'rayonnement' then
    raise exception 'CROSS_READING_TYPE_MISMATCH';
  end if;
  return new;
end $$;
create trigger trg_cross_reading_types before insert or update on cross_reading
  for each row execute function check_cross_reading_types();

-- ---------------------------------------------------------------------------
-- 7. Rapports, cartes de partage
-- ---------------------------------------------------------------------------
create table report (
  id                uuid primary key default gen_random_uuid(),
  contact_id        uuid not null references contact(id) on delete restrict,
  snapshot_refs     jsonb not null,                    -- {score_snapshot_ids[], insight_snapshot_ids[], cross_reading_id?}
  token_hash        text not null unique,
  status            report_status not null default 'pending',
  pdf_object_key    text,
  editorial_version text not null,
  revoked_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check ((status = 'revoked') = (revoked_at is not null))
);
create index report_contact_idx on report (contact_id);
create trigger trg_report_updated before update on report
  for each row execute function set_updated_at();

create table share_asset (
  id               uuid primary key default gen_random_uuid(),
  report_id        uuid references report(id) on delete cascade,
  participation_id uuid not null references participation(id) on delete cascade,
  format           share_format not null,
  object_key       text not null,
  token_hash       text not null unique,
  created_at       timestamptz not null default now(),
  unique (participation_id, format)
);

-- ---------------------------------------------------------------------------
-- 8. Administration (Supabase Auth = mot de passe, TOTP, sessions)
-- ---------------------------------------------------------------------------
create table admin_user (
  id              uuid primary key references auth.users(id) on delete restrict,
  prenom          text not null,
  nom             text not null,
  email           citext not null unique,
  role            admin_role not null,
  team            text,
  status          admin_status not null default 'invited',
  mfa_enrolled_at timestamptz,
  last_login_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (email ~* '@feexpay\.me$')
);
create trigger trg_admin_user_updated before update on admin_user
  for each row execute function set_updated_at();

-- Dernier administrateur actif protégé
create or replace function guard_last_admin() returns trigger
language plpgsql as $$
declare remaining int;
begin
  if old.role = 'admin' and old.status = 'active'
     and (tg_op = 'DELETE' or new.role <> 'admin' or new.status <> 'active') then
    select count(*) into remaining from admin_user
      where role = 'admin' and status = 'active' and id <> old.id;
    if remaining = 0 then
      raise exception 'LAST_ADMIN_GUARD';
    end if;
  end if;
  return coalesce(new, old);
end $$;
create trigger trg_admin_last_guard before update or delete on admin_user
  for each row execute function guard_last_admin();

alter table scoring_version
  add constraint scoring_version_author_fk foreign key (author_id) references admin_user(id) on delete set null;

create table admin_recovery_code (
  id            uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references admin_user(id) on delete cascade,
  code_hash     text not null,                         -- argon2id
  used_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index admin_recovery_code_user_idx on admin_recovery_code (admin_user_id) where used_at is null;

create table admin_invitation (
  id         uuid primary key default gen_random_uuid(),
  email      citext not null,
  role       admin_role not null,
  team       text,
  token_hash text not null unique,
  inviter_id uuid not null references admin_user(id) on delete restrict,
  expires_at timestamptz not null,
  status     invitation_status not null default 'pending',
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email ~* '@feexpay\.me$')
);
-- Une seule invitation pending par email (renvoi = ancienne passe revoked)
create unique index admin_invitation_pending_email on admin_invitation (email) where status = 'pending';
create trigger trg_admin_invitation_updated before update on admin_invitation
  for each row execute function set_updated_at();

create table audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references admin_user(id) on delete set null,
  action      text not null,
  target_type text not null,
  target_id   text,
  payload_min jsonb,
  ip          inet,
  ts          timestamptz not null default now()
);
create index audit_log_target_idx on audit_log (target_type, target_id, ts desc);
create index audit_log_actor_idx on audit_log (actor_id, ts desc);
create trigger trg_audit_log_immutable before update or delete on audit_log
  for each row execute function forbid_mutation();

-- ---------------------------------------------------------------------------
-- 9. Notifications, outbox tracking, exports
-- ---------------------------------------------------------------------------
create table notification (
  id                  uuid primary key default gen_random_uuid(),
  report_id           uuid references report(id) on delete cascade,
  admin_invitation_id uuid references admin_invitation(id) on delete cascade,
  template            text not null,
  recipient           citext not null,
  status              notification_status not null default 'queued',
  provider_id         text,
  attempts            smallint not null default 0,
  last_error          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (num_nonnulls(report_id, admin_invitation_id) = 1)
);
create index notification_provider_idx on notification (provider_id) where provider_id is not null;
create index notification_report_idx on notification (report_id) where report_id is not null;
create trigger trg_notification_updated before update on notification
  for each row execute function set_updated_at();

create table tracking_event_outbox (
  id         uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_id   uuid not null unique,                     -- même id côté Pixel => dédup CAPI
  payload    jsonb not null,
  targets    text[] not null,                          -- {'ga4_mp','meta_capi'}
  sent_at    timestamptz,
  attempts   smallint not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);
create index tracking_event_outbox_pending_idx on tracking_event_outbox (created_at) where sent_at is null;

create table export_job (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references admin_user(id) on delete restrict,
  scope      jsonb not null,                           -- filtres
  motif      text not null,
  status     job_status not null default 'queued',
  object_key text,
  row_count  integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_export_job_updated before update on export_job
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 10. RLS : deny-all (aucune policy). Accès via service role côté Nitro uniquement.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- pg-boss : crée lui-même le schéma `pgboss` au démarrage du worker (connexion directe 5432, pas le pooler).

commit;
