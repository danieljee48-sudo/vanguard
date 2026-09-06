-- VanGuard — pre-advertising migration
-- Run once in Supabase → SQL Editor → New Query. Safe to re-run (idempotent).
-- Adds the columns the updated app + Stripe webhook rely on, and makes the
-- signup trigger capture the referral code.

-- ── Profile columns ──────────────────────────────────────────────────────────
alter table profiles add column if not exists subscription_status text;      -- trialing | active | past_due | cancelled | lifetime
alter table profiles add column if not exists stripe_customer_id  text;
alter table profiles add column if not exists hygiene_rating       int;
alter table profiles add column if not exists lpg_enabled          boolean default true;
alter table profiles add column if not exists water_enabled        boolean default false;
alter table profiles add column if not exists team_size            text default 'solo';
alter table profiles add column if not exists food_type            text;
alter table profiles add column if not exists custom_checklists    jsonb;   -- {opening:[],closing:[],cleaning:[],removed:{...}}
-- Referral tracking
alter table profiles add column if not exists referred_by          text;    -- referral code (first 8 chars of referrer's id)
alter table profiles add column if not exists referral_rewarded    boolean default false;

-- Helps the webhook resolve a referrer quickly (id like 'code%').
create index if not exists profiles_id_text_idx on profiles ((id::text) text_pattern_ops);

-- ── Signup trigger: capture referral code from signup metadata ────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, business_name, referred_by)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'businessName',
    new.raw_user_meta_data->>'referred_by'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
