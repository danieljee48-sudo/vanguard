-- VanGuard Clean billing / entitlement layer
-- Run in Supabase after the core Clean schema.

create table if not exists public.clean_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan text not null default 'business' check (plan in ('starter','business','pro')),
  billing_interval text not null default 'month' check (billing_interval in ('month','year')),
  status text not null default 'trialing' check (status in ('trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired')),
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists clean_subscriptions_one_current_per_user
  on public.clean_subscriptions(user_id)
  where status in ('trialing','active','past_due','incomplete');
create index if not exists clean_subscriptions_user_idx on public.clean_subscriptions(user_id);

alter table public.clean_subscriptions enable row level security;
drop policy if exists clean_subscriptions_select_own on public.clean_subscriptions;
create policy clean_subscriptions_select_own on public.clean_subscriptions
  for select using (auth.uid() = user_id);

-- Webhook/service-role writes bypass RLS. Keep INSERT/UPDATE/DELETE unavailable to browser clients.

create or replace function public.clean_has_access(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.clean_subscriptions
    where user_id = p_user_id
      and status in ('trialing','active','past_due','incomplete')
      and (status <> 'trialing' or trial_end is null or trial_end > now())
  );
$$;

revoke all on function public.clean_has_access(uuid) from public;
grant execute on function public.clean_has_access(uuid) to authenticated;
