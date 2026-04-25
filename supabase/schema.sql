-- ──────────────────────────────────────────────────────────────────────────
-- Taskly — schéma initial + RLS
-- À coller dans Supabase Dashboard → SQL Editor → Run.
-- Re-jouable : utilise IF NOT EXISTS + DROP POLICY IF EXISTS.
-- ──────────────────────────────────────────────────────────────────────────

-- ── Enums ────────────────────────────────────────────────────────────────
do $$ begin
  create type priority_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type goal_period as enum ('week', 'month', 'year', '3years');
exception when duplicate_object then null; end $$;

-- ── Tables ───────────────────────────────────────────────────────────────

-- Tasks (niveau racine)
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  icon        text not null,
  color       text not null,
  completed   boolean not null default false,
  priority    priority_level,
  due_date    date,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- SubTasks (enfants d'une task)
-- user_id dénormalisé pour permettre des policies RLS sans JOIN
create table if not exists public.sub_tasks (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  completed   boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Goals
create table if not exists public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  period      goal_period not null,
  completed   boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Habits
create table if not exists public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- HabitCompletions : une ligne par jour coché (table dédiée plutôt qu'array)
-- → permet l'index par date pour la heatmap, INSERT/DELETE atomique au toggle
create table if not exists public.habit_completions (
  id          uuid primary key default gen_random_uuid(),
  habit_id    uuid not null references public.habits(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  created_at  timestamptz not null default now(),
  unique (habit_id, date)
);

-- ── Indexes ──────────────────────────────────────────────────────────────
create index if not exists idx_tasks_user_position           on public.tasks (user_id, position);
create index if not exists idx_sub_tasks_task                on public.sub_tasks (task_id, position);
create index if not exists idx_sub_tasks_user                on public.sub_tasks (user_id);
create index if not exists idx_goals_user_position           on public.goals (user_id, position);
create index if not exists idx_habits_user_position          on public.habits (user_id, position);
create index if not exists idx_habit_completions_habit_date  on public.habit_completions (habit_id, date);
create index if not exists idx_habit_completions_user_date   on public.habit_completions (user_id, date);

-- ── Trigger : updated_at sur tasks ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────
alter table public.tasks              enable row level security;
alter table public.sub_tasks          enable row level security;
alter table public.goals              enable row level security;
alter table public.habits             enable row level security;
alter table public.habit_completions  enable row level security;

-- ── Policies : tasks ─────────────────────────────────────────────────────
drop policy if exists tasks_select on public.tasks;
drop policy if exists tasks_insert on public.tasks;
drop policy if exists tasks_update on public.tasks;
drop policy if exists tasks_delete on public.tasks;

create policy tasks_select on public.tasks
  for select using (auth.uid() = user_id);

create policy tasks_insert on public.tasks
  for insert with check (auth.uid() = user_id);

create policy tasks_update on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy tasks_delete on public.tasks
  for delete using (auth.uid() = user_id);

-- ── Policies : sub_tasks ─────────────────────────────────────────────────
drop policy if exists sub_tasks_select on public.sub_tasks;
drop policy if exists sub_tasks_insert on public.sub_tasks;
drop policy if exists sub_tasks_update on public.sub_tasks;
drop policy if exists sub_tasks_delete on public.sub_tasks;

create policy sub_tasks_select on public.sub_tasks
  for select using (auth.uid() = user_id);

create policy sub_tasks_insert on public.sub_tasks
  for insert with check (auth.uid() = user_id);

create policy sub_tasks_update on public.sub_tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy sub_tasks_delete on public.sub_tasks
  for delete using (auth.uid() = user_id);

-- ── Policies : goals ─────────────────────────────────────────────────────
drop policy if exists goals_select on public.goals;
drop policy if exists goals_insert on public.goals;
drop policy if exists goals_update on public.goals;
drop policy if exists goals_delete on public.goals;

create policy goals_select on public.goals
  for select using (auth.uid() = user_id);

create policy goals_insert on public.goals
  for insert with check (auth.uid() = user_id);

create policy goals_update on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy goals_delete on public.goals
  for delete using (auth.uid() = user_id);

-- ── Policies : habits ────────────────────────────────────────────────────
drop policy if exists habits_select on public.habits;
drop policy if exists habits_insert on public.habits;
drop policy if exists habits_update on public.habits;
drop policy if exists habits_delete on public.habits;

create policy habits_select on public.habits
  for select using (auth.uid() = user_id);

create policy habits_insert on public.habits
  for insert with check (auth.uid() = user_id);

create policy habits_update on public.habits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy habits_delete on public.habits
  for delete using (auth.uid() = user_id);

-- ── Policies : habit_completions ─────────────────────────────────────────
drop policy if exists habit_completions_select on public.habit_completions;
drop policy if exists habit_completions_insert on public.habit_completions;
drop policy if exists habit_completions_update on public.habit_completions;
drop policy if exists habit_completions_delete on public.habit_completions;

create policy habit_completions_select on public.habit_completions
  for select using (auth.uid() = user_id);

create policy habit_completions_insert on public.habit_completions
  for insert with check (auth.uid() = user_id);

create policy habit_completions_update on public.habit_completions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy habit_completions_delete on public.habit_completions
  for delete using (auth.uid() = user_id);
