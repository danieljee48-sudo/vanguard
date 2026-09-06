-- Repair the signup trigger ("Database error saving new user").
-- Safe to run; idempotent.

-- 1) Make sure the referral columns exist
alter table public.profiles add column if not exists referred_by       text;
alter table public.profiles add column if not exists referral_rewarded boolean default false;

-- 2) Rebuild the signup trigger with an explicit schema + search_path
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, business_name, referred_by)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'businessName',
    new.raw_user_meta_data->>'referred_by'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
