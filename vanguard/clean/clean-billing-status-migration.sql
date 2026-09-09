-- VanGuard Clean billing status compatibility migration.
-- Safe additive fix for databases where vanguard-clean-billing.sql was already run
-- before Stripe's `paused` subscription status was included.

do $$
begin
  if to_regclass('public.clean_subscriptions') is not null then
    alter table public.clean_subscriptions
      drop constraint if exists clean_subscriptions_status_check;
    alter table public.clean_subscriptions
      add constraint clean_subscriptions_status_check
      check (status in ('trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused'));
  end if;
end $$;
