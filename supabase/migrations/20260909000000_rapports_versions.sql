-- ---------------------------------------------------------------------------
-- Lot 6 : A07 « Rapports et emails » et T01 « Versions ».
--   notification.events : journal horodaté d'un envoi (généré, accepté, remis, ouvert,
--   rejeté), alimenté par l'envoi et par le webhook Resend.
--   report.opened_at : première consultation du rapport en ligne (indicateur A07).
-- ---------------------------------------------------------------------------
alter table notification add column if not exists events jsonb not null default '[]'::jsonb;
alter table report add column if not exists opened_at timestamptz;
create index if not exists notification_provider_idx on notification (provider_id);
create index if not exists notification_created_idx on notification (created_at desc);
