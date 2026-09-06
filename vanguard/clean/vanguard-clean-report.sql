-- Report-ready snapshot data for VanGuard Clean.
-- Keeps generated reports reproducible even if a checklist is edited later.

create table if not exists public.clean_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  record_id uuid references clean_records on delete cascade not null,
  report_number text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists clean_report_record_unique
  on public.clean_report_snapshots(record_id);
create index if not exists clean_report_user_created_idx
  on public.clean_report_snapshots(user_id, created_at desc);

alter table public.clean_report_snapshots enable row level security;
drop policy if exists "Clean users manage own report snapshots" on public.clean_report_snapshots;
create policy "Clean users manage own report snapshots"
  on public.clean_report_snapshots
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
