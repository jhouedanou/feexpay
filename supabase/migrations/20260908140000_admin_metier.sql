-- ---------------------------------------------------------------------------
-- Lot 5 admin métier (maquette A02 à A08).
--   levier_feexpay / levier_constat : rattachement constat → produit affiché en A05
--   (« Leviers FeexPay associés »). La maquette prime sur le CDC (décision client du
--   8 septembre 2026). Table éditable par un Administrateur, initialisée depuis la maquette.
--   Le rattachement se fait sur la dimension du constat (colonne « qualification » de la
--   matrice), stable d'une version de moteur à l'autre.
--   prospect_suivi / prospect_note : bloc « Suivi commercial » de A04.
-- ---------------------------------------------------------------------------
create table if not exists levier_feexpay (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  nom         text not null,
  icone       text not null,                          -- nom MDI (kebab)
  description text not null,
  ordre       smallint not null default 0,
  actif       boolean not null default true,
  updated_by  uuid references admin_user(id) on delete set null,
  updated_at  timestamptz not null default now()
);
create table if not exists levier_constat (
  levier_id  uuid not null references levier_feexpay(id) on delete cascade,
  dimension  text not null,
  role       text not null check (role in ('traite', 'support')),
  primary key (levier_id, dimension)
);

insert into levier_feexpay (code, nom, icone, description, ordre) values
  ('feexpage', 'FeexPage', 'storefront-outline',
   'Une page de paiement hébergée donne un canal de vente en ligne et un journal d’encaissement unique — les deux manques déclarés au même endroit.', 1),
  ('feexlink', 'FeexLink', 'link-variant',
   'Les liens de paiement envoyés par WhatsApp remplacent la relance verbale et datent chaque demande.', 2),
  ('dashboard', 'Tableau de bord marchand', 'cash-fast',
   'Rapprochement des encaissements par opérateur, exportable — la reconstitution manuelle disparaît.', 3)
on conflict (code) do nothing;

insert into levier_constat (levier_id, dimension, role)
select l.id, d.dimension, d.role
  from levier_feexpay l
  join (values
    ('feexpage',  'Écarts d’encaissement',        'traite'),
    ('feexpage',  'Parcours de vente digital',    'traite'),
    ('feexpage',  'Présence digitale',            'traite'),
    ('feexpage',  'Performance digitale',         'support'),
    ('feexlink',  'Paiement à distance',          'traite'),
    ('feexlink',  'Délégation des encaissements', 'traite'),
    ('feexlink',  'Traçabilité d’un paiement',    'support'),
    ('dashboard', 'Écarts d’encaissement',        'support'),
    ('dashboard', 'Suivi des ventes',             'traite'),
    ('dashboard', 'Centralisation des paiements', 'traite'),
    ('dashboard', 'Traçabilité d’un paiement',    'traite'),
    ('dashboard', 'Comptabilité',                 'traite'),
    ('dashboard', 'Trésorerie',                   'support')
  ) as d(code, dimension, role) on d.code = l.code
on conflict do nothing;

create table if not exists prospect_suivi (
  contact_id  uuid primary key references contact(id) on delete cascade,
  statut      text not null default 'a_contacter'
              check (statut in ('a_contacter', 'en_cours', 'rendez_vous', 'converti', 'sans_suite')),
  assignee_id uuid references admin_user(id) on delete set null,
  updated_by  uuid references admin_user(id) on delete set null,
  updated_at  timestamptz not null default now()
);
create table if not exists prospect_note (
  id         uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contact(id) on delete cascade,
  author_id  uuid references admin_user(id) on delete set null,
  texte      text not null check (length(texte) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists prospect_note_contact_idx on prospect_note (contact_id, created_at desc);

-- Index de lecture pour les listes admin.
create index if not exists participation_contact_idx on participation (contact_id, diagnostic_type, completed_at desc);
create index if not exists participation_started_idx on participation (started_at desc);

do $$
declare t text;
begin
  foreach t in array array['levier_feexpay', 'levier_constat', 'prospect_suivi', 'prospect_note'] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('revoke all on %I from anon, authenticated', t);
  end loop;
end $$;
