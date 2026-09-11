-- ---------------------------------------------------------------------------
-- Recette fonctionnelle partagée (page /admin/recette)
--
-- Chaque testeur marque chaque contrôle OK, KO ou passé, avec une note. Une ligne par
-- contrôle et par testeur ; tout le monde voit les résultats des autres. La liste des
-- contrôles vit dans le code (server/data/recette.json), la table ne porte que les résultats.
-- ---------------------------------------------------------------------------

create table if not exists recette_resultat (
  controle   text not null,
  testeur_id uuid not null references admin_user(id) on delete cascade,
  statut     text not null check (statut in ('ok', 'ko', 'passe')),
  note       text not null default '',
  updated_at timestamptz not null default now(),
  primary key (controle, testeur_id)
);

alter table recette_resultat enable row level security;
alter table recette_resultat force row level security;
revoke all on recette_resultat from anon, authenticated;
