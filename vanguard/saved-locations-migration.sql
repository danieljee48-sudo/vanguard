-- VanGuard saved trading locations
-- Run once in Supabase SQL Editor.

create table if not exists public.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text not null default '',
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.saved_locations enable row level security;

drop policy if exists "Users manage own saved locations" on public.saved_locations;
create policy "Users manage own saved locations"
on public.saved_locations
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Normalise any rows if this migration is re-run after an earlier version.
update public.saved_locations set address = '' where address is null;
alter table public.saved_locations alter column address set default '';
alter table public.saved_locations alter column address set not null;

-- Remove any duplicate saved locations before adding the unique constraint.
delete from public.saved_locations a
using public.saved_locations b
where a.ctid < b.ctid
  and a.user_id = b.user_id
  and a.name = b.name
  and a.address = b.address;

alter table public.saved_locations drop constraint if exists saved_locations_user_name_address_key;
alter table public.saved_locations add constraint saved_locations_user_name_address_key unique (user_id, name, address);

-- Seed the new list from existing pitch history so existing users immediately
-- have their previously logged trading locations available in the Diary dropdown.
insert into public.saved_locations (user_id, name, address, last_used_at)
select distinct on (p.user_id, p.name, coalesce(p.address, ''))
  p.user_id, p.name, coalesce(p.address, ''), coalesce(p.created_at, now())
from public.pitch_logs p
where p.name is not null and trim(p.name) <> ''
order by p.user_id, p.name, coalesce(p.address, ''), p.created_at desc
on conflict do nothing;
