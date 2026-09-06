-- Adds the flag the app uses to require onboarding once per account.
alter table public.profiles add column if not exists onboarded boolean default false;
