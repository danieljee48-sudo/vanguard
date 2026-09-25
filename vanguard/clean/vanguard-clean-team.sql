-- VanGuard Clean: multi-user workspaces, roles, approvals and site entitlements.
-- Run after vanguard-clean-schema.sql and vanguard-clean-billing.sql.
-- Starter remains single-login. Business/Pro unlock workspace members and manager approvals.

create schema if not exists private;

create table if not exists public.clean_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade unique,
  name text not null default 'My Cleaning Business',
  created_at timestamptz not null default now()
);

create table if not exists public.clean_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.clean_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'cleaner' check (role in ('owner','admin','cleaner')),
  display_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(workspace_id,user_id)
);

alter table public.clean_workspaces enable row level security;
alter table public.clean_memberships enable row level security;

insert into public.clean_workspaces(owner_user_id,name)
select u.id, coalesce(nullif(u.raw_user_meta_data->>'company_name',''),'My Cleaning Business')
from auth.users u
where exists (
  select 1 from public.clean_sites s where s.user_id=u.id
  union
  select 1 from public.clean_checklists c where c.user_id=u.id
  union
  select 1 from public.clean_records r where r.user_id=u.id
)
on conflict (owner_user_id) do nothing;

insert into public.clean_memberships(workspace_id,user_id,role,display_name)
select w.id,w.owner_user_id,'owner',
       coalesce(nullif(u.raw_user_meta_data->>'name',''),split_part(coalesce(u.email,''),'@',1),'Owner')
from public.clean_workspaces w
join auth.users u on u.id=w.owner_user_id
on conflict (workspace_id,user_id) do update set role='owner', active=true;

alter table public.clean_sites add column if not exists workspace_id uuid references public.clean_workspaces(id) on delete cascade;
alter table public.clean_checklists add column if not exists workspace_id uuid references public.clean_workspaces(id) on delete cascade;
alter table public.clean_records add column if not exists workspace_id uuid references public.clean_workspaces(id) on delete cascade;
alter table public.clean_issues add column if not exists workspace_id uuid references public.clean_workspaces(id) on delete cascade;
alter table public.clean_signoffs add column if not exists workspace_id uuid references public.clean_workspaces(id) on delete cascade;

update public.clean_sites s set workspace_id=w.id from public.clean_workspaces w where s.workspace_id is null and w.owner_user_id=s.user_id;
update public.clean_checklists c set workspace_id=w.id from public.clean_workspaces w where c.workspace_id is null and w.owner_user_id=c.user_id;
update public.clean_records r set workspace_id=w.id from public.clean_workspaces w where r.workspace_id is null and w.owner_user_id=r.user_id;
update public.clean_issues i set workspace_id=w.id from public.clean_workspaces w where i.workspace_id is null and w.owner_user_id=i.user_id;
update public.clean_signoffs s set workspace_id=w.id from public.clean_workspaces w where s.workspace_id is null and w.owner_user_id=s.user_id;

create or replace function public.clean_current_workspace()
returns uuid language sql stable security definer set search_path=''
as $$ select m.workspace_id from public.clean_memberships m where m.user_id=(select auth.uid()) and m.active=true order by case when m.role='owner' then 0 else 1 end limit 1 $$;

create or replace function public.clean_current_role()
returns text language sql stable security definer set search_path=''
as $$ select m.role from public.clean_memberships m where m.user_id=(select auth.uid()) and m.active=true order by case when m.role='owner' then 0 when m.role='admin' then 1 else 2 end limit 1 $$;

create or replace function public.clean_is_manager()
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.clean_memberships m where m.user_id=(select auth.uid()) and m.active=true and m.role in ('owner','admin')) $$;

grant execute on function public.clean_current_workspace() to authenticated;
grant execute on function public.clean_current_role() to authenticated;
grant execute on function public.clean_is_manager() to authenticated;

create or replace function public.clean_bootstrap_workspace()
returns trigger language plpgsql security definer set search_path=''
as $$
declare wid uuid; display_name text;
begin
  if coalesce(new.raw_user_meta_data->>'product','') <> 'clean' then return new; end if;
  insert into public.clean_workspaces(owner_user_id,name)
  values(new.id,coalesce(nullif(new.raw_user_meta_data->>'company_name',''),'My Cleaning Business'))
  on conflict (owner_user_id) do nothing returning id into wid;
  if wid is null then select id into wid from public.clean_workspaces where owner_user_id=new.id; end if;
  display_name:=coalesce(nullif(new.raw_user_meta_data->>'name',''),split_part(coalesce(new.email,''),'@',1),'Owner');
  insert into public.clean_memberships(workspace_id,user_id,role,display_name)
  values(wid,new.id,'owner',display_name)
  on conflict(workspace_id,user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_clean_user_created on auth.users;
create trigger on_clean_user_created after insert on auth.users for each row execute function public.clean_bootstrap_workspace();

create or replace function public.clean_fill_workspace()
returns trigger language plpgsql security definer set search_path=''
as $$
declare wid uuid;
begin
  if new.workspace_id is not null then return new; end if;
  select public.clean_current_workspace() into wid;
  if wid is null then
    execute format('select w.id from public.clean_workspaces w where w.owner_user_id=$1') into wid using new.user_id;
  end if;
  new.workspace_id:=wid;
  return new;
end;
$$;

drop trigger if exists clean_sites_fill_workspace on public.clean_sites;
create trigger clean_sites_fill_workspace before insert on public.clean_sites for each row execute function public.clean_fill_workspace();
drop trigger if exists clean_checklists_fill_workspace on public.clean_checklists;
create trigger clean_checklists_fill_workspace before insert on public.clean_checklists for each row execute function public.clean_fill_workspace();
drop trigger if exists clean_records_fill_workspace on public.clean_records;
create trigger clean_records_fill_workspace before insert on public.clean_records for each row execute function public.clean_fill_workspace();
drop trigger if exists clean_issues_fill_workspace on public.clean_issues;
create trigger clean_issues_fill_workspace before insert on public.clean_issues for each row execute function public.clean_fill_workspace();
drop trigger if exists clean_signoffs_fill_workspace on public.clean_signoffs;
create trigger clean_signoffs_fill_workspace before insert on public.clean_signoffs for each row execute function public.clean_fill_workspace();

alter table public.clean_records add column if not exists submitted_at timestamptz;
alter table public.clean_records add column if not exists completed_by uuid references auth.users(id) on delete set null;
alter table public.clean_records add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.clean_records add column if not exists reviewed_at timestamptz;
alter table public.clean_records add column if not exists review_notes text;
alter table public.clean_records drop constraint if exists clean_records_status_check;
alter table public.clean_records add constraint clean_records_status_check check (status in ('in_progress','pending_review','changes_required','completed','flagged'));

create table if not exists public.clean_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.clean_workspaces(id) on delete cascade,
  record_id uuid not null references public.clean_records(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check (decision in ('approved','changes_required')),
  notes text,
  created_at timestamptz not null default now()
);
alter table public.clean_reviews enable row level security;

drop policy if exists "Clean users manage own sites" on public.clean_sites;
drop policy if exists "Clean users manage own checklists" on public.clean_checklists;
drop policy if exists "Clean users manage own records" on public.clean_records;
drop policy if exists "Clean users manage own issues" on public.clean_issues;
drop policy if exists "Clean users manage own signoffs" on public.clean_signoffs;

create policy clean_sites_member_select on public.clean_sites for select to authenticated using (workspace_id=(select public.clean_current_workspace()));
create policy clean_sites_manager_write on public.clean_sites for all to authenticated using (workspace_id=(select public.clean_current_workspace()) and (select public.clean_is_manager())) with check (workspace_id=(select public.clean_current_workspace()) and (select public.clean_is_manager()));

create policy clean_checklists_member_select on public.clean_checklists for select to authenticated using (workspace_id=(select public.clean_current_workspace()));
create policy clean_checklists_manager_write on public.clean_checklists for all to authenticated using (workspace_id=(select public.clean_current_workspace()) and (select public.clean_is_manager())) with check (workspace_id=(select public.clean_current_workspace()) and (select public.clean_is_manager()));

create policy clean_records_member_select on public.clean_records for select to authenticated using (workspace_id=(select public.clean_current_workspace()));
create policy clean_records_member_insert on public.clean_records for insert to authenticated with check (workspace_id=(select public.clean_current_workspace()));
create policy clean_records_member_update on public.clean_records for update to authenticated using (workspace_id=(select public.clean_current_workspace())) with check (workspace_id=(select public.clean_current_workspace()));

create policy clean_issues_member_select on public.clean_issues for select to authenticated using (workspace_id=(select public.clean_current_workspace()));
create policy clean_issues_member_write on public.clean_issues for all to authenticated using (workspace_id=(select public.clean_current_workspace())) with check (workspace_id=(select public.clean_current_workspace()));

create policy clean_signoffs_member_select on public.clean_signoffs for select to authenticated using (workspace_id=(select public.clean_current_workspace()));
create policy clean_signoffs_manager_write on public.clean_signoffs for all to authenticated using (workspace_id=(select public.clean_current_workspace()) and (select public.clean_is_manager())) with check (workspace_id=(select public.clean_current_workspace()) and (select public.clean_is_manager()));

create policy clean_reviews_member_select on public.clean_reviews for select to authenticated using (workspace_id=(select public.clean_current_workspace()));
create policy clean_reviews_manager_write on public.clean_reviews for insert to authenticated with check (workspace_id=(select public.clean_current_workspace()) and (select public.clean_is_manager()) and reviewer_id=(select auth.uid()));

create policy clean_workspace_member_select on public.clean_workspaces for select to authenticated using (id=(select public.clean_current_workspace()));
create policy clean_membership_member_select on public.clean_memberships for select to authenticated using (workspace_id=(select public.clean_current_workspace()));
create policy clean_membership_manager_write on public.clean_memberships for all to authenticated using (workspace_id=(select public.clean_current_workspace()) and (select public.clean_is_manager())) with check (workspace_id=(select public.clean_current_workspace()) and (select public.clean_is_manager()));

create index if not exists clean_memberships_user_idx on public.clean_memberships(user_id);
create index if not exists clean_memberships_workspace_idx on public.clean_memberships(workspace_id);
create index if not exists clean_sites_workspace_idx on public.clean_sites(workspace_id);
create index if not exists clean_checklists_workspace_idx on public.clean_checklists(workspace_id);
create index if not exists clean_records_workspace_idx on public.clean_records(workspace_id);
create index if not exists clean_reviews_record_idx on public.clean_reviews(record_id);

create or replace function public.clean_site_limit()
returns integer language sql stable security definer set search_path=''
as $$
  select coalesce((select case
    when s.status in ('trialing','active','past_due','incomplete') and s.plan='starter' then 3
    when s.status in ('trialing','active','past_due','incomplete') and s.plan='business' then 15
    when s.status in ('trialing','active','past_due','incomplete') and s.plan='pro' then 2147483647
    else 1 end
  from public.clean_subscriptions s
  join public.clean_workspaces w on w.owner_user_id=s.user_id
  where w.id=(select public.clean_current_workspace())
  order by s.updated_at desc limit 1),1)
$$;

create or replace function public.clean_enforce_site_limit()
returns trigger language plpgsql security definer set search_path=''
as $$
declare lim integer; cnt integer;
begin
  lim:=public.clean_site_limit();
  select count(*) into cnt from public.clean_sites where workspace_id=coalesce(new.workspace_id,public.clean_current_workspace()) and active=true;
  if cnt >= lim then raise exception 'site_limit_reached: Your plan allows % active site(s). Upgrade to add another site.',lim; end if;
  return new;
end;
$$;

drop trigger if exists clean_site_limit_guard on public.clean_sites;
create trigger clean_site_limit_guard before insert on public.clean_sites for each row execute function public.clean_enforce_site_limit();
grant execute on function public.clean_site_limit() to authenticated;
