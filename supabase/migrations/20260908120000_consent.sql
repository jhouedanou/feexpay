-- ---------------------------------------------------------------------------
-- Consentement (CDC V1.2 : C01, C02, CMP01) — preuve séparée des choix cookies, du
-- traitement requis et du contact facultatif. Horodatage, version du texte, portée,
-- statut et origine du choix. Jamais transmis aux plateformes publicitaires.
-- ---------------------------------------------------------------------------
create table if not exists consent_record (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid references anonymous_session(id) on delete set null,
  contact_id     uuid references contact(id) on delete set null,
  type           text not null check (type in ('cookies', 'traitement', 'contact')),
  statut         text not null check (statut in ('accepte', 'refuse', 'partiel')),
  policy_version text not null,
  text_version   text not null,
  source         text not null,                       -- c01, c02, footer, p10
  details        jsonb,                               -- {analytics, ads} pour les cookies
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists consent_record_session_idx on consent_record (session_id, type, created_at desc);
create index if not exists consent_record_contact_idx on consent_record (contact_id, type, created_at desc);
create trigger trg_consent_record_updated before update on consent_record
  for each row execute function set_updated_at();
alter table consent_record enable row level security;
alter table consent_record force row level security;
revoke all on consent_record from anon, authenticated;

-- Accord de contact commercial, dénormalisé sur le contact pour la fiche prospect.
alter table contact add column if not exists contact_allowed boolean not null default false;
