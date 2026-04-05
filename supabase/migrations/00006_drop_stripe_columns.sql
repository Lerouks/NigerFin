-- Remove Stripe-related columns. The project switched to iPayMoney
-- (Mobile Money + card) and manual transfers (Nita, Amana). No user
-- has ever paid via Stripe on this project, so historical data loss
-- is not a concern.

alter table user_profiles drop column if exists stripe_customer_id;
alter table subscriptions drop column if exists stripe_subscription_id;
alter table subscriptions drop column if exists stripe_customer_id;
