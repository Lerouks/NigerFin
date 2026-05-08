-- Create invoices table for NFI Report Premium subscriptions.
-- Each invoice is a permanent legal document (OHADA, conservation 10 ans).
-- Numbers are atomically generated as FAC-YYYY-NNNN per year via advisory lock.

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  user_id uuid not null references auth.users(id) on delete restrict,

  -- Money
  amount_xof bigint not null check (amount_xof >= 0),
  currency text not null default 'XOF',

  -- Status / lifecycle
  status text not null default 'paid'
    check (status in ('draft', 'paid', 'cancelled', 'refunded')),

  -- Content
  description text not null,
  line_items jsonb not null,
  customer jsonb not null,
  issuer jsonb not null,

  -- Payment metadata
  payment_reference text,
  payment_method text,
  billing_cycle text check (billing_cycle in ('monthly', 'semi_annual', 'annual')),
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,

  -- Storage
  pdf_path text,

  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_user_id_paid_at
  on public.invoices (user_id, paid_at desc);

create index if not exists idx_invoices_status_partial
  on public.invoices (status)
  where status <> 'paid';

comment on table public.invoices is
  'Factures legales NFI Report Premium. Documents OHADA, jamais supprimes (cancel/refund prefere).';
comment on column public.invoices.invoice_number is
  'Numero sequentiel format FAC-YYYY-NNNN, genere atomiquement par trigger.';
comment on column public.invoices.line_items is
  'Snapshot JSONB des lignes facturees (description, qty, unit_price_xof, total_xof). Jamais altere apres emission.';
comment on column public.invoices.customer is
  'Snapshot JSONB du client au moment de l emission (name, email, address, niu, rccm). Reste valable meme si le profil utilisateur change.';
comment on column public.invoices.issuer is
  'Snapshot JSONB de l emetteur NFI Group SARL (name, capital, rccm, niu, address). Reste valable meme si la fiche emetteur evolue.';

-- Atomic invoice number generator using advisory lock keyed by year.
-- Prevents concurrent INSERT races without locking the whole table.
create or replace function public.generate_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_year int := extract(year from now())::int;
  next_seq int;
begin
  perform pg_advisory_xact_lock(hashtext('invoice_seq_' || current_year));

  select coalesce(
    max((substring(invoice_number from 'FAC-\d{4}-(\d+)$'))::int),
    0
  ) + 1
    into next_seq
    from public.invoices
   where invoice_number like 'FAC-' || current_year || '-%';

  return 'FAC-' || current_year || '-' || lpad(next_seq::text, 4, '0');
end;
$$;

revoke all on function public.generate_invoice_number() from public, anon, authenticated;

-- BEFORE INSERT trigger: auto-generate invoice_number if missing.
create or replace function public.invoices_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.invoice_number is null or new.invoice_number = '' then
    new.invoice_number := public.generate_invoice_number();
  end if;
  return new;
end;
$$;

drop trigger if exists invoices_before_insert_trigger on public.invoices;
create trigger invoices_before_insert_trigger
  before insert on public.invoices
  for each row execute function public.invoices_before_insert();

-- BEFORE UPDATE trigger: bump updated_at.
create or replace function public.invoices_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists invoices_set_updated_at_trigger on public.invoices;
create trigger invoices_set_updated_at_trigger
  before update on public.invoices
  for each row execute function public.invoices_set_updated_at();

-- RLS
alter table public.invoices enable row level security;

-- Users can SELECT their own invoices.
drop policy if exists "Users can view their own invoices" on public.invoices;
create policy "Users can view their own invoices" on public.invoices
  for select to authenticated
  using (auth.uid() = user_id);

-- Admins can SELECT all invoices.
drop policy if exists "Admins can view all invoices" on public.invoices;
create policy "Admins can view all invoices" on public.invoices
  for select to authenticated
  using (
    exists (
      select 1 from public.user_profiles
       where user_profiles.id = auth.uid()
         and user_profiles.role = 'admin'
    )
  );

-- INSERT / UPDATE / DELETE: no policy = denied for authenticated users.
-- Service role bypasses RLS (used server-side after iPayMoney validation).

-- Permissions
revoke all on public.invoices from public, anon;
grant select on public.invoices to authenticated;
