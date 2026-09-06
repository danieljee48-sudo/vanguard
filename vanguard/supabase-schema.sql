-- VanGuard Database Schema
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor → New Query)

-- ── PROFILES ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  business_name text,
  unit_type text default 'van',
  authority text,
  plan text default 'trial',
  trial_start date default current_date,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users manage own profile" on profiles for all using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, business_name)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'businessName'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── DAILY DIARIES ─────────────────────────────────────────────────────────────
create table if not exists diaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  location text,
  opening jsonb default '{}',
  closing jsonb default '{}',
  issues text,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table diaries enable row level security;
create policy "Users manage own diaries" on diaries for all using (auth.uid() = user_id);

-- ── TEMPERATURE LOGS ──────────────────────────────────────────────────────────
create table if not exists temp_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  time text,
  unit text,
  temp decimal,
  type text,
  threshold decimal,
  pass boolean,
  action text,
  created_at timestamptz default now()
);
alter table temp_logs enable row level security;
create policy "Users manage own temp logs" on temp_logs for all using (auth.uid() = user_id);

-- ── CLEANING LOGS ─────────────────────────────────────────────────────────────
create table if not exists cleaning_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  checks jsonb default '{}',
  saved_by text,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table cleaning_logs enable row level security;
create policy "Users manage own cleaning logs" on cleaning_logs for all using (auth.uid() = user_id);

-- ── VAN / UNIT CHECKS ─────────────────────────────────────────────────────────
create table if not exists van_checks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  checks jsonb default '{}',
  signed_by text,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table van_checks enable row level security;
create policy "Users manage own van checks" on van_checks for all using (auth.uid() = user_id);

-- ── LPG LOGS ──────────────────────────────────────────────────────────────────
create table if not exists lpg_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  hose boolean default false,
  regulator boolean default false,
  flame boolean default false,
  no_leaks boolean default false,
  notes text,
  created_at timestamptz default now()
);
alter table lpg_logs enable row level security;
create policy "Users manage own LPG logs" on lpg_logs for all using (auth.uid() = user_id);

-- ── WATER TANK LOGS ───────────────────────────────────────────────────────────
create table if not exists water_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  filled boolean default false,
  cleaned boolean default false,
  sanitised boolean default false,
  created_at timestamptz default now()
);
alter table water_logs enable row level security;
create policy "Users manage own water logs" on water_logs for all using (auth.uid() = user_id);

-- ── PITCH LOGS ────────────────────────────────────────────────────────────────
create table if not exists pitch_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  name text,
  address text,
  created_at timestamptz default now()
);
alter table pitch_logs enable row level security;
create policy "Users manage own pitch logs" on pitch_logs for all using (auth.uid() = user_id);
