-- Newsletter foundations: subscribers, issues, delivery events.
-- Replaces Beehiiv as source of truth.

-- ─── Subscribers (anyone who opted-in, with or without an NFI account) ───
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  status text not null default 'active'
    check (status in ('active', 'unsubscribed', 'bounced', 'complained')),
  -- Optional link to auth user if the subscriber has an NFI account
  user_id uuid references auth.users(id) on delete set null,
  -- Where they opted in (e.g. 'form_homepage', 'popup', 'signup', 'admin')
  source text,
  -- Locale for future i18n
  locale text not null default 'fr',
  -- Stable token used to sign one-click unsubscribe URLs (RFC 8058)
  unsubscribe_token uuid not null default gen_random_uuid(),
  opt_in_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_newsletter_subscribers_status
  on public.newsletter_subscribers(status);
create index if not exists idx_newsletter_subscribers_user_id
  on public.newsletter_subscribers(user_id)
  where user_id is not null;
create unique index if not exists idx_newsletter_subscribers_unsubscribe_token
  on public.newsletter_subscribers(unsubscribe_token);

comment on table public.newsletter_subscribers is
  'Liste des abonnes a la newsletter NFI Report. Source de verite (Beehiiv deprecie).';

-- ─── Issues (numeros editoriaux) ───
create table if not exists public.newsletter_issues (
  id uuid primary key default gen_random_uuid(),
  number int unique not null,
  slug text unique not null,
  subject text not null,
  preheader text,
  -- Audience targeting
  audience text not null default 'premium'
    check (audience in ('premium', 'all', 'free')),
  -- Editorial content stored as JSONB (matches NewsletterIssue TS interface)
  content jsonb not null,
  -- Lifecycle
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  -- Denormalized counters (updated by webhook job)
  recipients_count int not null default 0,
  delivered_count int not null default 0,
  opened_count int not null default 0,
  clicked_count int not null default 0,
  bounced_count int not null default 0,
  unsubscribed_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_newsletter_issues_status
  on public.newsletter_issues(status);
create index if not exists idx_newsletter_issues_sent_desc
  on public.newsletter_issues(sent_at desc nulls last)
  where status = 'sent';

comment on table public.newsletter_issues is
  'Numeros editoriaux de la newsletter NFI Report. Le champ content suit le schema NewsletterIssue (src/emails/types.ts).';

-- ─── Events (delivery tracking via Resend webhook) ───
create table if not exists public.newsletter_events (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references public.newsletter_issues(id) on delete cascade,
  subscriber_id uuid references public.newsletter_subscribers(id) on delete set null,
  event_type text not null
    check (event_type in ('delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
  meta jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_newsletter_events_issue
  on public.newsletter_events(issue_id, event_type);
create index if not exists idx_newsletter_events_subscriber
  on public.newsletter_events(subscriber_id, event_type)
  where subscriber_id is not null;

-- ─── Triggers ───

create or replace function public.newsletter_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists newsletter_subscribers_set_updated_at on public.newsletter_subscribers;
create trigger newsletter_subscribers_set_updated_at
  before update on public.newsletter_subscribers
  for each row execute function public.newsletter_set_updated_at();

drop trigger if exists newsletter_issues_set_updated_at on public.newsletter_issues;
create trigger newsletter_issues_set_updated_at
  before update on public.newsletter_issues
  for each row execute function public.newsletter_set_updated_at();

-- Auto-increment issue number on insert if not provided
create or replace function public.newsletter_issues_assign_number()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.number is null then
    new.number := coalesce(
      (select max(number) + 1 from public.newsletter_issues),
      1
    );
  end if;
  return new;
end;
$$;

drop trigger if exists newsletter_issues_assign_number on public.newsletter_issues;
create trigger newsletter_issues_assign_number
  before insert on public.newsletter_issues
  for each row execute function public.newsletter_issues_assign_number();

-- ─── RLS ───
alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_issues enable row level security;
alter table public.newsletter_events enable row level security;

-- Subscribers: only admins can SELECT (privacy: emails are PII).
drop policy if exists "Admins read all subscribers" on public.newsletter_subscribers;
create policy "Admins read all subscribers" on public.newsletter_subscribers
  for select to authenticated
  using (
    exists (
      select 1 from public.user_profiles
       where user_profiles.id = auth.uid()
         and user_profiles.role = 'admin'
    )
  );

-- Issues: anyone (including anon) can read SENT issues (public archive).
drop policy if exists "Anyone reads sent issues" on public.newsletter_issues;
create policy "Anyone reads sent issues" on public.newsletter_issues
  for select to anon, authenticated
  using (status = 'sent');

-- Admins can read all issues (drafts, scheduled, etc.).
drop policy if exists "Admins read all issues" on public.newsletter_issues;
create policy "Admins read all issues" on public.newsletter_issues
  for select to authenticated
  using (
    exists (
      select 1 from public.user_profiles
       where user_profiles.id = auth.uid()
         and user_profiles.role = 'admin'
    )
  );

-- Events: admin only (analytics).
drop policy if exists "Admins read all events" on public.newsletter_events;
create policy "Admins read all events" on public.newsletter_events
  for select to authenticated
  using (
    exists (
      select 1 from public.user_profiles
       where user_profiles.id = auth.uid()
         and user_profiles.role = 'admin'
    )
  );

-- Permissions: locks down INSERT/UPDATE/DELETE to service-role only.
revoke all on public.newsletter_subscribers from public, anon;
grant select on public.newsletter_subscribers to authenticated;

revoke all on public.newsletter_issues from public;
grant select on public.newsletter_issues to anon, authenticated;

revoke all on public.newsletter_events from public, anon;
grant select on public.newsletter_events to authenticated;
