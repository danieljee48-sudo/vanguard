-- OPTIONAL — run once in the Supabase SQL editor.
--
-- The app already treats a brand-new account as being on the 14-day free trial
-- (no card required), so this is NOT required for the trial to work. It only makes
-- the trial state explicit in the database so the "trial_started" funnel event
-- (GA + Meta) fires, and so reports read cleanly.
--
-- It updates the signup trigger to stamp subscription_status = 'trialing' on the
-- new profile. trial_start already defaults to today's date.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, business_name, referred_by, subscription_status)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'businessName',
    new.raw_user_meta_data->>'referred_by',
    'trialing'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
