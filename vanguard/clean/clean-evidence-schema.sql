-- VanGuard Clean evidence schema
-- Additive migration for photo evidence linked to cleaning records/issues.

create table if not exists clean_photos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  record_id uuid references clean_records on delete cascade not null,
  issue_id uuid references clean_issues on delete set null,
  storage_path text not null,
  caption text,
  kind text default 'general' check (kind in ('before','after','issue','general')),
  created_at timestamptz default now()
);

alter table clean_photos enable row level security;
drop policy if exists "Clean users manage own photos" on clean_photos;
create policy "Clean users manage own photos" on clean_photos
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists clean_photos_user_idx on clean_photos(user_id);
create index if not exists clean_photos_record_idx on clean_photos(record_id);
create index if not exists clean_photos_issue_idx on clean_photos(issue_id);

-- Private Supabase Storage bucket for cleaning evidence.
insert into storage.buckets (id, name, public)
values ('clean-evidence', 'clean-evidence', false)
on conflict (id) do nothing;

drop policy if exists "Clean users upload evidence" on storage.objects;
create policy "Clean users upload evidence" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'clean-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Clean users read evidence" on storage.objects;
create policy "Clean users read evidence" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'clean-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Clean users update evidence" on storage.objects;
create policy "Clean users update evidence" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'clean-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'clean-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Clean users delete evidence" on storage.objects;
create policy "Clean users delete evidence" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'clean-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
