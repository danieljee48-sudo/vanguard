-- VanGuard Clean internationalisation / evidence extension
-- Additive to the MVP schema. Run after vanguard-clean-schema.sql.
-- Designed so one product can serve multiple countries without hard-coding UK rules.

create table if not exists clean_settings (
  user_id uuid references auth.users on delete cascade primary key,
  country_code text default 'GB',
  locale text default 'en-GB',
  currency text default 'GBP',
  timezone text default 'Europe/London',
  date_format text default 'DD/MM/YYYY',
  measurement_system text default 'metric',
  language text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table clean_settings enable row level security;
drop policy if exists "Clean users manage own settings" on clean_settings;
create policy "Clean users manage own settings" on clean_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists clean_evidence (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  record_id uuid references clean_records on delete cascade not null,
  record_item_id uuid references clean_record_items on delete set null,
  storage_path text not null,
  file_name text,
  mime_type text,
  file_size bigint,
  captured_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table clean_evidence enable row level security;
drop policy if exists "Clean users manage own evidence" on clean_evidence;
create policy "Clean users manage own evidence" on clean_evidence
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists clean_evidence_user_idx on clean_evidence(user_id);
create index if not exists clean_evidence_record_idx on clean_evidence(record_id);
create index if not exists clean_evidence_item_idx on clean_evidence(record_item_id);

-- Private storage bucket for customer evidence. Files should be accessed using
-- authenticated storage policies or signed URLs; never expose the bucket publicly.
insert into storage.buckets (id, name, public)
values ('clean-evidence', 'clean-evidence', false)
on conflict (id) do update set public = false;

drop policy if exists "Clean evidence upload own files" on storage.objects;
create policy "Clean evidence upload own files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'clean-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Clean evidence read own files" on storage.objects;
create policy "Clean evidence read own files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'clean-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Clean evidence delete own files" on storage.objects;
create policy "Clean evidence delete own files" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'clean-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Reusable country/region metadata. These are product defaults, not legal advice.
create table if not exists clean_template_catalog (
  id uuid default gen_random_uuid() primary key,
  template_key text unique not null,
  name text not null,
  description text,
  region_code text default 'INTL',
  language text default 'en',
  category text default 'quality',
  active boolean default true,
  created_at timestamptz default now()
);
alter table clean_template_catalog enable row level security;
drop policy if exists "Clean users can view template catalog" on clean_template_catalog;
create policy "Clean users can view template catalog" on clean_template_catalog
  for select to authenticated using (active = true);

insert into clean_template_catalog (template_key,name,description,region_code,language,category)
values
 ('office-daily-intl','Office Daily Cleaning','General commercial office quality checklist. Adapt tasks to the customer scope of work.','INTL','en','quality'),
 ('office-daily-us','Office Daily Cleaning — US','US-oriented operational template. Does not itself certify OSHA compliance.','US','en','quality'),
 ('office-daily-uk','Office Daily Cleaning — UK','UK-oriented operational template. Does not itself certify HSE compliance.','GB','en','quality'),
 ('office-daily-ca','Office Daily Cleaning — Canada','Canadian operational template for commercial cleaning teams.','CA','en','quality'),
 ('office-daily-au','Office Daily Cleaning — Australia','Australian operational template for commercial cleaning teams.','AU','en','quality'),
 ('restroom-inspection-intl','Restroom Inspection','General restroom quality and consumables inspection.','INTL','en','quality'),
 ('site-safety-walk-intl','Site Safety Walk','General hazard-observation checklist for site walkthroughs.','INTL','en','safety')
on conflict (template_key) do nothing;
