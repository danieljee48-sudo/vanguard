-- VanGuard Clean team access hardening.
-- Run after vanguard-clean-team.sql and vanguard-clean-team-hardening.sql.
-- Keeps Free/Starter accounts single-user even if a former team member remains in memberships.

create or replace function public.clean_current_workspace()
returns uuid
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  wid uuid;
  owner_id uuid;
  role_name text;
begin
  select m.workspace_id, m.role
    into wid, role_name
  from public.clean_memberships m
  where m.user_id=(select auth.uid())
    and m.active=true
  order by case when m.role='owner' then 0 when m.role='admin' then 1 else 2 end
  limit 1;

  if wid is null then return null; end if;

  if role_name='owner' then
    return wid;
  end if;

  select w.owner_user_id into owner_id
  from public.clean_workspaces w
  where w.id=wid
  limit 1;

  if exists(
    select 1
    from public.clean_subscriptions s
    where s.user_id=owner_id
      and s.status in ('trialing','active','past_due','incomplete')
      and s.plan in ('business','pro')
  ) then
    return wid;
  end if;

  return null;
end;
$$;

grant execute on function public.clean_current_workspace() to authenticated;
