-- Seed ~45 days of realistic historic records for a SHOWCASE account.
-- 1) Change the email below to your showcase account's email.
-- 2) Run once in Supabase → SQL Editor. (Running twice will duplicate temp/pitch/water rows.)
-- Safe: only touches that one account. Diary/cleaning/unit use ON CONFLICT so today isn't overwritten.

do $$
declare
  uid uuid;
  nm  text;
begin
  select id into uid from auth.users where email = 'REPLACE_WITH_SHOWCASE@EMAIL.com';
  if uid is null then raise exception 'No user found with that email'; end if;
  select coalesce(name,'Sam Rivera') into nm from profiles where id = uid;

  -- Daily diary (opening + closing fully completed)
  insert into diaries (user_id, date, location, opening, closing, issues)
  select uid, g::date,
    (array['Borough Market','Camden Market','Greenwich Market','Brick Lane','Southbank Centre','Maltby Street Market'])[1+floor(random()*6)],
    '{"0":true,"1":true,"2":true,"3":true}'::jsonb,
    '{"0":true,"1":true,"2":true,"3":true}'::jsonb,
    null
  from generate_series(current_date-45, current_date-1, interval '1 day') g
  on conflict (user_id,date) do nothing;

  -- Temperature readings (3/day, all passing)
  insert into temp_logs (user_id, date, time, unit, temp, type, threshold, pass, action)
  select uid, g::date, t.tm, t.unit, round((t.lo + random()*(t.hi-t.lo))::numeric,1), t.typ, t.th, true, null
  from generate_series(current_date-45, current_date-1, interval '1 day') g,
    (values ('08:15','Fridge','cold',8,2.5,5.0),
            ('08:20','Freezer','cold',-18,-21.0,-18.0),
            ('12:30','Hot Hold','hot',63,64.0,71.0)) as t(tm,unit,typ,th,lo,hi);

  -- Cleaning schedule (all items done)
  insert into cleaning_logs (user_id, date, checks, saved_by)
  select uid, g::date,
    '{"0":true,"1":true,"2":true,"3":true,"4":true,"5":true,"6":true,"7":true}'::jsonb, nm
  from generate_series(current_date-45, current_date-1, interval '1 day') g
  on conflict (user_id,date) do nothing;

  -- Daily unit / van checks (all items done)
  insert into van_checks (user_id, date, checks, signed_by)
  select uid, g::date,
    '{"0":true,"1":true,"2":true,"3":true,"4":true,"5":true,"6":true,"7":true}'::jsonb, nm
  from generate_series(current_date-45, current_date-1, interval '1 day') g
  on conflict (user_id,date) do nothing;

  -- Pitch log (every 3rd day)
  insert into pitch_logs (user_id, date, name, address)
  select uid, g::date,
    (array['Borough Market','Camden Market','Greenwich Market','Brick Lane Market'])[1+floor(random()*4)],
    'London'
  from generate_series(current_date-45, current_date-1, interval '3 day') g;

  -- LPG safety check (weekly)
  insert into lpg_logs (user_id, date, hose, regulator, flame, no_leaks, notes)
  select uid, g::date, true, true, true, true, null
  from generate_series(current_date-42, current_date-1, interval '7 day') g;

  -- Water tank log (every other day)
  insert into water_logs (user_id, date, filled, cleaned, sanitised)
  select uid, g::date, true, true, true
  from generate_series(current_date-45, current_date-1, interval '2 day') g;
end $$;
