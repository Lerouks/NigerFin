-- 00036 : inscription et « Mon compte », décisions de Raouf du 26 et 27/11/2026.
--
-- 1. La tranche d'âge, facultative, remplace la date de naissance dans les
--    formulaires. Les tranches sont celles de Meta (src/lib/regles-du-compte.ts).
--    Les colonnes birth_day, birth_month et birth_year restent, vides.
-- 2. Le pays n'est plus enregistré d'office : la colonne perd sa valeur par
--    défaut « Niger ». Les profils existants ne changent pas.
-- 3. Quand un lecteur change lui-même d'adresse e-mail (après avoir confirmé
--    depuis l'ancienne et la nouvelle adresse), son profil et son abonnement à
--    la newsletter suivent la nouvelle adresse : les factures et les envois
--    partent alors au bon endroit. Le déclencheur n'empêche jamais le
--    changement : une erreur est seulement signalée.
--
-- Additive : aucune donnée existante n'est modifiée ni effacée.
-- Appliquer seule : supabase db query --linked --file supabase/migrations/00036_inscription_tranche_age_pays_email.sql
-- (jamais « db push », voir la fiche des migrations).
--
-- Retour arrière :
--   drop trigger if exists on_auth_user_email_changed on auth.users;
--   drop function if exists public.suivre_changement_email();
--   alter table public.user_profiles alter column country set default 'Niger';
--   alter table public.user_profiles drop constraint if exists user_profiles_age_range_check;
--   alter table public.user_profiles drop column if exists age_range;

alter table public.user_profiles add column if not exists age_range text;

alter table public.user_profiles drop constraint if exists user_profiles_age_range_check;
alter table public.user_profiles add constraint user_profiles_age_range_check
  check (age_range is null or age_range in ('moins-18', '18-24', '25-34', '35-44', '45-54', '55-64', '65-plus'));

comment on column public.user_profiles.age_range is
  'Tranche d''âge facultative (tranches de Meta) : moins-18, 18-24, 25-34, 35-44, 45-54, 55-64, 65-plus.';

alter table public.user_profiles alter column country drop default;

create or replace function public.suivre_changement_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is not null and new.email is distinct from old.email then
    begin
      update public.user_profiles
        set email = new.email, updated_at = now()
        where id = new.id;
      -- L'adresse est unique dans la liste des abonnés : si la nouvelle y est
      -- déjà (inscrite autrement), on laisse les deux lignes telles quelles.
      if not exists (select 1 from public.newsletter_subscribers where email = lower(new.email)) then
        update public.newsletter_subscribers
          set email = lower(new.email)
          where user_id = new.id;
      end if;
    exception when others then
      raise warning 'suivre_changement_email (%): %', new.id, sqlerrm;
    end;
  end if;
  return new;
end;
$$;

revoke all on function public.suivre_changement_email() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.suivre_changement_email();
