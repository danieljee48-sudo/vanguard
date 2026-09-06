-- VanGuard — batch 2 (plan display + feedback). Run once in Supabase → SQL Editor. Idempotent.

-- Plan display: interval (month/year), renewal/expiry date, cancellation flag
alter table public.profiles add column if not exists plan_interval        text;
alter table public.profiles add column if not exists period_end           timestamptz;
alter table public.profiles add column if not exists cancel_at_period_end  boolean default false;

-- Feedback & suggestions (read submissions in Table Editor → feedback)
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  email text,
  message text not null,
  created_at timestamptz default now()
);
alter table public.feedback enable row level security;
drop policy if exists "Users can submit feedback" on public.feedback;
create policy "Users can submit feedback" on public.feedback
  for insert with check (auth.uid() = user_id);
