-- Hardening of the invoices migration (00011_create_invoices.sql).
-- Closes 3 Supabase advisor warnings:
--   1. function_search_path_mutable on invoices_set_updated_at
--   2. anon_security_definer_function_executable on invoices_before_insert
--   3. authenticated_security_definer_function_executable on invoices_before_insert

-- 1. Pin search_path on invoices_set_updated_at (was missing).
create or replace function public.invoices_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 2-3. Revoke EXECUTE on the trigger function from public/anon/authenticated.
-- The function only ever runs inside the trigger (postgres internal context),
-- it must NOT be callable via the PostgREST `/rpc/` endpoint.
revoke all on function public.invoices_before_insert() from public, anon, authenticated;
