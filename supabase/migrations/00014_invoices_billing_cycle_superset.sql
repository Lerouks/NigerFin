-- The codebase has two parallel BillingCycle conventions:
--   - src/config/pricing.ts: 'monthly' | 'quarterly' | 'yearly'
--   - src/lib/email-templates.ts paymentConfirmationEmail: 'monthly' | 'semi_annual' | 'annual'
-- This is a pre-existing inconsistency that we cannot rationalize today.
-- The invoices CHECK constraint must accept BOTH conventions to avoid
-- breaking production payment flows.

alter table public.invoices
  drop constraint if exists invoices_billing_cycle_check;

alter table public.invoices
  add constraint invoices_billing_cycle_check
  check (
    billing_cycle is null
    or billing_cycle in ('monthly', 'quarterly', 'yearly', 'semi_annual', 'annual')
  );
