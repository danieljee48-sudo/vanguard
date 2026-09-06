-- VanGuard Clean early-access waitlist
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.clean_waitlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 100),
  company_name text not null check (char_length(company_name) between 1 and 150),
  email text not null,
  country_code text not null default 'GB',
  sites_count text not null default '1',
  current_process text,
  source text not null default 'waitlist'
);

create unique index if not exists clean_waitlist_email_unique
  on public.clean_waitlist (lower(email));

create index if not exists clean_waitlist_created_at_idx
  on public.clean_waitlist (created_at desc);

alter table public.clean_waitlist enable row level security;

-- Deliberately no anon/authenticated INSERT or SELECT policy.
-- The public form writes through the Netlify function using the Supabase service-role key.
