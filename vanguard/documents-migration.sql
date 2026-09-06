-- VanGuard document storage
-- Run once in Supabase SQL Editor.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null default 'Other',
  path text not null unique,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

drop policy if exists "Users manage own documents" on public.documents;
create policy "Users manage own documents"
on public.documents
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('vanguard-documents', 'vanguard-documents', false, 15728640)
on conflict (id) do update set public = false, file_size_limit = 15728640;

drop policy if exists "Users upload own VanGuard documents" on storage.objects;
create policy "Users upload own VanGuard documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'vanguard-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users read own VanGuard documents" on storage.objects;
create policy "Users read own VanGuard documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'vanguard-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own VanGuard documents" on storage.objects;
create policy "Users delete own VanGuard documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'vanguard-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
