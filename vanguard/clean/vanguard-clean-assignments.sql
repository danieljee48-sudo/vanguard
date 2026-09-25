-- VanGuard Clean: team assignment workflow + membership access hardening.
-- Run after vanguard-clean-team.sql, vanguard-clean-team-hardening.sql,
-- and vanguard-clean-team-access.sql.

create table if not exists public.clean_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.clean_workspaces(id) on delete cascade,
  site_id uuid not null references public.clean_sites(id) on delete cascade,
  checklist_id uuid not null references public.clean_checklists(id) on delete cascade,
  cleaner_id uuid not null references auth.users(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  due_at timestamptz,
  status text not null default 'assigned' check (status in ('assigned','in_progress','pending_review','changes_required','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

alter table public.clean_assignments enable row level security;

drop policy if exists clean_assignments_select on public.clean_assignments;
drop policy if exists clean_assignments_manager_write on public.clean_assignments;
drop policy if exists clean_assignments_cleaner_update on public.clean_assignments;

create policy clean_assignments_select on public.clean_assignments
for select to authenticated
using (
  workspace_id=(select public.clean_current_workspace())
  and ((select public.clean_is_manager()) or cleaner_id=(select auth.uid()))
);

create policy clean_assignments_manager_write on public.clean_assignments
for all to authenticated
using (
  workspace_id=(select public.clean_current_workspace())
  and (select public.clean_is_manager())
)
with check (
  workspace_id=(select public.clean_current_workspace())
  and (select public.clean_is_manager())
  and created_by=(select auth.uid())
);

create policy clean_assignments_cleaner_update on public.clean_assignments
for update to authenticated
using (
  workspace_id=(select public.clean_current_workspace())
  and cleaner_id=(select auth.uid())
)
with check (
  workspace_id=(select public.clean_current_workspace())
  and cleaner_id=(select auth.uid())
);

create index if not exists clean_assignments_workspace_idx on public.clean_assignments(workspace_id,status,due_at);
create index if not exists clean_assignments_cleaner_idx on public.clean_assignments(cleaner_id,status,due_at);

drop policy if exists clean_membership_member_select on public.clean_memberships;
create policy clean_membership_member_select on public.clean_memberships
for select to authenticated
using (
  user_id=(select auth.uid())
  or workspace_id=(select public.clean_current_workspace())
);

-- Keep team membership useful for the signed-in owner/member even when the
-- workspace resolver is being evaluated for the first time.
grant select on public.clean_memberships to authenticated;
