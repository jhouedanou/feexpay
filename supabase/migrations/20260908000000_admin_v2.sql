-- ---------------------------------------------------------------------------
-- Lot 4 — comptes admin (décisions client du 8 septembre 2026)
--   · domaines acceptés : feexpay.me et bigfiveabidjan.com
--   · réglages de compte de l'écran A09 (2FA imposée, périmètre géographique, export)
--   · réglages applicatifs modifiables en admin (identifiants de tracking)
-- ---------------------------------------------------------------------------

alter table admin_user drop constraint if exists admin_user_email_check;
alter table admin_user
  add constraint admin_user_email_check
  check (email ~* '@(feexpay\.me|bigfiveabidjan\.com)$');

alter table admin_invitation drop constraint if exists admin_invitation_email_check;
alter table admin_invitation
  add constraint admin_invitation_email_check
  check (email ~* '@(feexpay\.me|bigfiveabidjan\.com)$');

alter table admin_user
  add column if not exists mfa_required   boolean not null default false,
  add column if not exists geo_restricted boolean not null default false,
  add column if not exists export_allowed boolean not null default false,
  add column if not exists invited_by     uuid references admin_user(id) on delete set null,
  add column if not exists failed_logins  smallint not null default 0,
  add column if not exists locked_until   timestamptz;

alter table admin_invitation
  add column if not exists prenom         text,
  add column if not exists nom            text,
  add column if not exists mfa_required   boolean not null default false,
  add column if not exists geo_restricted boolean not null default false,
  add column if not exists export_allowed boolean not null default false;

-- Réglages applicatifs : une ligne par clé. Les jetons de tracking y sont initialisés
-- depuis le plan de tracking V1.2 et restent modifiables depuis l'admin (rôle Administrateur).
create table if not exists app_setting (
  key        text primary key,
  value      text not null default '',
  secret     boolean not null default false,          -- masqué à l'affichage, jamais envoyé au public
  updated_by uuid references admin_user(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table app_setting enable row level security;
alter table app_setting force row level security;
revoke all on app_setting from anon, authenticated;

insert into app_setting (key, value, secret) values
  ('tracking_enabled',          'true',                false),
  ('ga4_measurement_id',        'G-N2BEKD7NM3',        false),
  ('meta_pixel_id',             '2579023315884016',    false),
  ('meta_capi_access_token',    'EAANSDBWang0BSdFovMZCdNgua6CuzLPs2qOglQQiMeGbc0sRZAASi3DiZCGZAfemV6AyngjHKA7vPsrAANRfkeFwPbvdUlZAwZAUgcn0ujIqnW4MIloaBw1ShW0ZApwDw7LzvS4GZBZAHBb7nSSeuc0NLoJ5jAKSC4GlYj1YhD5AXPAo6OQDbMaeIF2i1vOzloWpNGwZDZD', true),
  ('meta_capi_test_event_code', '',                    true)
on conflict (key) do nothing;
