-- Centre de commandement email (Phase 3) : suivi des e-mails transactionnels.
-- Miroir de newsletter_events, mais indexe par TYPE d'e-mail (+ user_id) au lieu
-- d'un numero de newsletter. Alimente par le webhook Resend via les tags
-- nfi_email_type + nfi_user_id poses sur chaque envoi transactionnel.

create table if not exists public.transactional_email_events (
  id uuid primary key default gen_random_uuid(),
  email_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null
    check (event_type in ('delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
  recipient text,
  meta jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_transactional_events_type
  on public.transactional_email_events(email_type, event_type);
create index if not exists idx_transactional_events_user
  on public.transactional_email_events(user_id, event_type)
  where user_id is not null;

comment on table public.transactional_email_events is
  'Evenements de delivery Resend par TYPE d''e-mail transactionnel (bienvenue, facture, etc.). Alimentee par le webhook via tags nfi_email_type + nfi_user_id.';

-- Agregat par type : nb envoyes/ouverts pour le Cockpit.
create or replace function public.transactional_email_stats()
returns table (
  email_type text,
  delivered bigint,
  opened bigint,
  clicked bigint,
  bounced bigint
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    email_type,
    count(*) filter (where event_type = 'delivered') as delivered,
    count(*) filter (where event_type = 'opened')    as opened,
    count(*) filter (where event_type = 'clicked')   as clicked,
    count(*) filter (where event_type = 'bounced')   as bounced
  from public.transactional_email_events
  group by email_type;
$$;

revoke all on function public.transactional_email_stats() from public, anon, authenticated;
grant execute on function public.transactional_email_stats() to service_role;

-- RLS : admin lecture, service_role ecriture.
alter table public.transactional_email_events enable row level security;

drop policy if exists "Admins read transactional events" on public.transactional_email_events;
create policy "Admins read transactional events" on public.transactional_email_events
  for select to authenticated
  using (
    exists (
      select 1 from public.user_profiles
       where user_profiles.id = auth.uid()
         and user_profiles.role = 'admin'
    )
  );

revoke all on public.transactional_email_events from public, anon;
grant select on public.transactional_email_events to authenticated;
grant select, insert, update, delete on public.transactional_email_events to service_role;
