-- Kanban Task Board schema.
-- Run in the Supabase SQL Editor. Safe to re-run: every statement is idempotent.

-- ---------- Table ----------
create table if not exists public.tasks (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  status      text        not null default 'todo',
  user_id     uuid        not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  description text        not null default '',
  priority    text        not null default 'normal',
  due_date    date,

  -- At least one non-whitespace character, at most 200 characters.
  constraint tasks_title_not_blank   check (title ~ '\S'),
  constraint tasks_title_length      check (char_length(title) <= 200),
  constraint tasks_description_length check (char_length(description) <= 2000),
  constraint tasks_status_valid      check (status in ('todo', 'in_progress', 'in_review', 'done')),
  constraint tasks_priority_valid    check (priority in ('low', 'normal', 'high'))
);

-- Every query filters by owner and orders by created_at, id.
create index if not exists tasks_user_id_created_at_idx
  on public.tasks (user_id, created_at, id);

-- ---------- Privileges ----------
-- Start from nothing, then grant only what the app needs.
-- Anonymous Auth guests use the `authenticated` role; `anon` means no session at all.
revoke all on table public.tasks from anon, authenticated;

grant select, delete on table public.tasks to authenticated;
-- Clients may not choose id or created_at; the database generates them.
grant insert (user_id, title, description, status, priority, due_date)
  on table public.tasks to authenticated;
-- Only editable fields can change; user_id, id, and created_at are never updatable.
grant update (title, description, status, priority, due_date)
  on table public.tasks to authenticated;

-- ---------- Row Level Security ----------
alter table public.tasks enable row level security;

-- `(select auth.uid())` is evaluated once per query instead of once per row.
drop policy if exists "Guests can read their own tasks" on public.tasks;
create policy "Guests can read their own tasks"
  on public.tasks for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Guests can create their own tasks" on public.tasks;
create policy "Guests can create their own tasks"
  on public.tasks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Guests can update their own tasks" on public.tasks;
create policy "Guests can update their own tasks"
  on public.tasks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Guests can delete their own tasks" on public.tasks;
create policy "Guests can delete their own tasks"
  on public.tasks for delete
  to authenticated
  using ((select auth.uid()) = user_id);
