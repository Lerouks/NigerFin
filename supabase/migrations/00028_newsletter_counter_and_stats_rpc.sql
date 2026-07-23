-- Centre de commandement email (Cockpit NFI).
-- 1) Repare le bug BUG-1 : la RPC increment_newsletter_counter est appelee par
--    le webhook Resend (src/app/api/webhooks/resend/route.ts) mais n'avait
--    jamais ete creee, donc les compteurs opened/clicked/bounced/unsubscribed
--    sur newsletter_issues restaient bloques a 0.
-- 2) Ajoute newsletter_issue_stats : agregat en direct depuis newsletter_events
--    (source de verite), consomme par la route GET /api/admin/newsletter/[id]/stats.

-- ─── 1. Increment atomique d'un compteur denormalise ───
create or replace function public.increment_newsletter_counter(
  p_issue_id uuid,
  p_field text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Whitelist stricte des colonnes autorisees : anti-injection sur le nom de
  -- colonne (p_field est interpole dans un format() dynamique).
  if p_field not in (
    'recipients_count', 'delivered_count', 'opened_count',
    'clicked_count', 'bounced_count', 'unsubscribed_count'
  ) then
    raise exception 'Champ compteur non autorise: %', p_field;
  end if;

  execute format(
    'update public.newsletter_issues set %I = coalesce(%I, 0) + 1, updated_at = now() where id = $1',
    p_field, p_field
  ) using p_issue_id;
end;
$$;

revoke all on function public.increment_newsletter_counter(uuid, text) from public, anon, authenticated;
grant execute on function public.increment_newsletter_counter(uuid, text) to service_role;

comment on function public.increment_newsletter_counter(uuid, text) is
  'Incremente de 1 un compteur denormalise de newsletter_issues. Appelee par le webhook Resend. service_role uniquement.';

-- ─── 2. Statistiques agregees d'un numero (source de verite = events) ───
create or replace function public.newsletter_issue_stats(p_issue_id uuid)
returns table (
  delivered bigint,
  opened_unique bigint,
  clicked_unique bigint,
  bounced bigint,
  complained bigint,
  unsubscribed bigint
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    count(*) filter (where event_type = 'delivered')                  as delivered,
    count(distinct subscriber_id) filter (where event_type = 'opened')  as opened_unique,
    count(distinct subscriber_id) filter (where event_type = 'clicked') as clicked_unique,
    count(*) filter (where event_type = 'bounced')                     as bounced,
    count(*) filter (where event_type = 'complained')                  as complained,
    count(*) filter (where event_type = 'unsubscribed')                as unsubscribed
  from public.newsletter_events
  where issue_id = p_issue_id;
$$;

revoke all on function public.newsletter_issue_stats(uuid) from public, anon, authenticated;
grant execute on function public.newsletter_issue_stats(uuid) to service_role;

comment on function public.newsletter_issue_stats(uuid) is
  'Agregat en direct des events Resend d''un numero de newsletter. service_role uniquement.';
