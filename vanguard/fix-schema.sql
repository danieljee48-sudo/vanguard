-- VanGuard — Fix Schema (run this if supabase-schema.sql gives policy errors)
-- Drops and recreates all policies and the signup trigger

drop policy if exists "Users manage own profile" on profiles;
drop policy if exists "Users manage own diaries" on diaries;
drop policy if exists "Users manage own temp logs" on temp_logs;
drop policy if exists "Users manage own cleaning logs" on cleaning_logs;
drop policy if exists "Users manage own van checks" on van_checks;
drop policy if exists "Users manage own LPG logs" on lpg_logs;
drop policy if exists "Users manage own water logs" on water_logs;
drop policy if exists "Users manage own pitch logs" on pitch_logs;

create policy "Users manage own profile" on profiles for all using (auth.uid() = id);
create policy "Users manage own diaries" on diaries for all using (auth.uid() = user_id);
create policy "Users manage own temp logs" on temp_logs for all using (auth.uid() = user_id);
create policy "Users manage own cleaning logs" on cleaning_logs for all using (auth.uid() = user_id);
create policy "Users manage own van checks" on van_checks for all using (auth.uid() = user_id);
create policy "Users manage own LPG logs" on lpg_logs for all using (auth.uid() = user_id);
create policy "Users manage own water logs" on water_logs for all using (auth.uid() = user_id);
create policy "Users manage own pitch logs" on pitch_logs for all using (auth.uid() = user_id);

-- Recreate the signup trigger
drop trigger if exists on_auth_user_created on auth.users;
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, business_name)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'businessName');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
