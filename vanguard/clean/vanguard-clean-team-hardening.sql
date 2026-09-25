-- VanGuard Clean team hardening.
-- Run after vanguard-clean-team.sql.

alter table public.clean_records add column if not exists created_by uuid references auth.users(id) on delete set null;
update public.clean_records set created_by=user_id where created_by is null;

create or replace function public.clean_set_record_creator()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.created_by is null then new.created_by:=(select auth.uid()); end if;
  return new;
end;
$$;

drop trigger if exists clean_record_creator on public.clean_records;
create trigger clean_record_creator before insert on public.clean_records for each row execute function public.clean_set_record_creator();

drop policy if exists clean_records_member_select on public.clean_records;
drop policy if exists clean_records_member_insert on public.clean_records;
drop policy if exists clean_records_member_update on public.clean_records;

create policy clean_records_member_select on public.clean_records
for select to authenticated
using (workspace_id=(select public.clean_current_workspace()) and ((select public.clean_is_manager()) or created_by=(select auth.uid())));

create policy clean_records_member_insert on public.clean_records
for insert to authenticated
with check (workspace_id=(select public.clean_current_workspace()) and created_by=(select auth.uid()));

create policy clean_records_member_update on public.clean_records
for update to authenticated
using (workspace_id=(select public.clean_current_workspace()) and ((select public.clean_is_manager()) or created_by=(select auth.uid())))
with check (workspace_id=(select public.clean_current_workspace()) and ((select public.clean_is_manager()) or created_by=(select auth.uid())));

drop policy if exists "Clean users manage own record items" on public.clean_record_items;
create policy clean_record_items_member_select on public.clean_record_items
for select to authenticated
using (exists(select 1 from public.clean_records r where r.id=record_id and r.workspace_id=(select public.clean_current_workspace()) and ((select public.clean_is_manager()) or r.created_by=(select auth.uid()))));

create policy clean_record_items_member_write on public.clean_record_items
for all to authenticated
using (exists(select 1 from public.clean_records r where r.id=record_id and r.workspace_id=(select public.clean_current_workspace()) and ((select public.clean_is_manager()) or r.created_by=(select auth.uid()))))
with check (exists(select 1 from public.clean_records r where r.id=record_id and r.workspace_id=(select public.clean_current_workspace()) and ((select public.clean_is_manager()) or r.created_by=(select auth.uid()))));

create or replace function public.clean_enforce_record_status()
returns trigger language plpgsql security definer set search_path=''
as $$
declare role_name text;
begin
  role_name:=public.clean_current_role();
  if role_name='cleaner' and new.status not in ('in_progress','pending_review','changes_required') then
    raise exception 'manager_approval_required: Cleaners must submit cleans for manager approval.';
  end if;
  if role_name='cleaner' then
    new.reviewed_by:=old.reviewed_by;
    new.reviewed_at:=old.reviewed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists clean_record_status_guard on public.clean_records;
create trigger clean_record_status_guard before update on public.clean_records for each row execute function public.clean_enforce_record_status();

create index if not exists clean_records_created_by_idx on public.clean_records(created_by);
