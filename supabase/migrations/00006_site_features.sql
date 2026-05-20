-- Site-wide feature toggles, contrôlables depuis l'admin
-- Table à 1 row (id=1), colonnes booléennes par fonctionnalité visible/cachable.
-- Démarrage avec market_ticker_enabled, mais conçue pour accueillir d'autres
-- flags à venir (popups newsletter, banner promo, etc.) sans nouvelle migration.

create table if not exists public.site_features (
  id int primary key default 1,
  market_ticker_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

-- Insert la row par défaut si pas déjà présente (idempotent).
insert into public.site_features (id, market_ticker_enabled)
values (1, true)
on conflict (id) do nothing;

-- Activer RLS (obligatoire CLAUDE.md NIGERFIN).
alter table public.site_features enable row level security;

-- GRANT explicites obligatoires (durcissement Supabase Data API 2026-10-30).
-- Lecture publique : c'est juste de la config UI publique, pas sensible.
grant select on public.site_features to anon;
grant select on public.site_features to authenticated;
-- Service role écrit (admin via API route serveur).
grant select, update on public.site_features to service_role;

-- Policy : lecture publique pour tout le monde (anon + authenticated).
-- Écriture uniquement via service_role (API admin protégée), pas de policy
-- write nécessaire (service_role bypass RLS).
create policy "site_features read public"
  on public.site_features
  for select
  to anon, authenticated
  using (true);

-- Updated_at auto via trigger.
create or replace function public.set_site_features_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists site_features_set_updated_at on public.site_features;
create trigger site_features_set_updated_at
  before update on public.site_features
  for each row
  execute function public.set_site_features_updated_at();

-- REVOKE le trigger function du PUBLIC (durcissement CLAUDE.md NIGERFIN).
revoke all on function public.set_site_features_updated_at() from public, anon, authenticated;
grant execute on function public.set_site_features_updated_at() to service_role;
