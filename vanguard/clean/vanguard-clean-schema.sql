-- VanGuard Clean MVP schema
-- Run after the existing VanGuard schema in Supabase SQL Editor.
-- This is additive and does not modify the Food tables.

create table if not exists clean_sites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  customer_name text not null,
  site_name text not null,
  address text,
  frequency text default 'daily',
  active boolean default true,
  created_at timestamptz default now()
);
alter table clean_sites enable row level security;
drop policy if exists "Clean users manage own sites" on clean_sites;
create policy "Clean users manage own sites" on clean_sites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists clean_checklists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  frequency text default 'daily',
  active boolean default true,
  created_at timestamptz default now()
);
alter table clean_checklists enable row level security;
drop policy if exists "Clean users manage own checklists" on clean_checklists;
create policy "Clean users manage own checklists" on clean_checklists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists clean_checklist_items (
  id uuid default gen_random_uuid() primary key,
  checklist_id uuid references clean_checklists on delete cascade not null,
  label text not null,
  sort_order integer default 0,
  required boolean default true,
  created_at timestamptz default now()
);
alter table clean_checklist_items enable row level security;
drop policy if exists "Clean users manage checklist items" on clean_checklist_items;
create policy "Clean users manage checklist items" on clean_checklist_items
  for all using (exists (select 1 from clean_checklists c where c.id = checklist_id and c.user_id = auth.uid()))
  with check (exists (select 1 from clean_checklists c where c.id = checklist_id and c.user_id = auth.uid()));

create table if not exists clean_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  site_id uuid references clean_sites on delete set null,
  checklist_id uuid references clean_checklists on delete set null,
  cleaner_name text,
  status text default 'in_progress' check (status in ('in_progress','completed','flagged')),
  started_at timestamptz default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz default now()
);
alter table clean_records enable row level security;
drop policy if exists "Clean users manage own records" on clean_records;
create policy "Clean users manage own records" on clean_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists clean_record_items (
  id uuid default gen_random_uuid() primary key,
  record_id uuid references clean_records on delete cascade not null,
  checklist_item_id uuid references clean_checklist_items on delete set null,
  label text not null,
  result text default 'pending' check (result in ('pass','fail','na','pending')),
  note text,
  created_at timestamptz default now()
);
alter table clean_record_items enable row level security;
drop policy if exists "Clean users manage own record items" on clean_record_items;
create policy "Clean users manage own record items" on clean_record_items
  for all using (exists (select 1 from clean_records r where r.id = record_id and r.user_id = auth.uid()))
  with check (exists (select 1 from clean_records r where r.id = record_id and r.user_id = auth.uid()));

create table if not exists clean_issues (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  record_id uuid references clean_records on delete cascade,
  title text not null,
  description text,
  severity text default 'medium' check (severity in ('low','medium','high','critical')),
  status text default 'open' check (status in ('open','resolved')),
  due_date date,
  resolved_at timestamptz,
  resolution text,
  created_at timestamptz default now()
);
alter table clean_issues enable row level security;
drop policy if exists "Clean users manage own issues" on clean_issues;
create policy "Clean users manage own issues" on clean_issues
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists clean_signoffs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  record_id uuid references clean_records on delete cascade not null unique,
  signer_name text not null,
  signer_role text,
  signed_at timestamptz default now()
);
alter table clean_signoffs enable row level security;
drop policy if exists "Clean users manage own signoffs" on clean_signoffs;
create policy "Clean users manage own signoffs" on clean_signoffs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists clean_sites_user_idx on clean_sites(user_id);
create index if not exists clean_checklists_user_idx on clean_checklists(user_id);
create index if not exists clean_records_user_idx on clean_records(user_id);
create index if not exists clean_records_created_idx on clean_records(created_at desc);
create index if not exists clean_issues_user_status_idx on clean_issues(user_id,status);
