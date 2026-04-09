-- Add newsletter_subscribed flag to user_profiles
-- Tracks whether the user has subscribed to the newsletter
alter table user_profiles
  add column if not exists newsletter_subscribed boolean not null default false;
