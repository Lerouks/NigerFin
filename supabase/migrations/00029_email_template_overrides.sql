-- Centre de commandement email (Phase 2) : édition des TEXTES des e-mails
-- transactionnels depuis le Cockpit, sans toucher au design.
-- Un override ne stocke que du texte (objet + blocs nommés). Le rendu applique
-- ces textes par remplacement de chaîne sur le HTML des templates existants :
-- tant qu'aucun override n'existe, la sortie reste identique au byte près.

create table if not exists public.email_template_overrides (
  key text primary key,
  subject text,
  blocks jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

comment on table public.email_template_overrides is
  'Surcharges de textes (objet + blocs) des e-mails transactionnels NFI. Cle = TransactionalEmailKey (src/lib/emails/registry.ts).';

-- Trigger updated_at (reutilise le helper existant si present, sinon local).
create or replace function public.email_overrides_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists email_template_overrides_set_updated_at on public.email_template_overrides;
create trigger email_template_overrides_set_updated_at
  before update on public.email_template_overrides
  for each row execute function public.email_overrides_set_updated_at();

-- RLS : lecture admin uniquement, ecritures reservees au service_role.
alter table public.email_template_overrides enable row level security;

drop policy if exists "Admins read email overrides" on public.email_template_overrides;
create policy "Admins read email overrides" on public.email_template_overrides
  for select to authenticated
  using (
    exists (
      select 1 from public.user_profiles
       where user_profiles.id = auth.uid()
         and user_profiles.role = 'admin'
    )
  );

revoke all on public.email_template_overrides from public, anon;
grant select on public.email_template_overrides to authenticated;
grant select, insert, update, delete on public.email_template_overrides to service_role;
