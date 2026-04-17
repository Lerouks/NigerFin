-- Learning paths feature : guided study programs composed of existing lessons
-- Adds three tables:
--   learning_paths       : a curated sequence of lessons with metadata
--   learning_path_steps  : ordered link between a path and existing lessons
--   user_lesson_progress : per-user completion tracking (login required)

create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  icon text not null default 'GraduationCap',
  difficulty text not null default 'Debutant' check (difficulty in ('Debutant', 'Intermediaire', 'Avance')),
  goal_label text not null default '',
  sort_order integer not null default 0,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_path_steps (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths(id) on delete cascade,
  lesson_id uuid not null references public.education_lessons(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (path_id, lesson_id)
);

create index if not exists idx_learning_path_steps_path_order
  on public.learning_path_steps (path_id, sort_order);

create table if not exists public.user_lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.education_lessons(id) on delete cascade,
  completed_at timestamptz,
  last_viewed_at timestamptz not null default now(),
  quiz_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists idx_user_lesson_progress_user
  on public.user_lesson_progress (user_id);

-- Shared trigger function to auto-update updated_at on row mutation.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_learning_paths_updated_at on public.learning_paths;
create trigger trg_learning_paths_updated_at
  before update on public.learning_paths
  for each row execute function public.set_updated_at();

drop trigger if exists trg_user_lesson_progress_updated_at on public.user_lesson_progress;
create trigger trg_user_lesson_progress_updated_at
  before update on public.user_lesson_progress
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.learning_paths enable row level security;
alter table public.learning_path_steps enable row level security;
alter table public.user_lesson_progress enable row level security;

drop policy if exists "learning_paths_select_public" on public.learning_paths;
create policy "learning_paths_select_public"
  on public.learning_paths
  for select
  using (available = true);

drop policy if exists "learning_path_steps_select_public" on public.learning_path_steps;
create policy "learning_path_steps_select_public"
  on public.learning_path_steps
  for select
  using (true);

drop policy if exists "user_lesson_progress_own_select" on public.user_lesson_progress;
create policy "user_lesson_progress_own_select"
  on public.user_lesson_progress
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_lesson_progress_own_insert" on public.user_lesson_progress;
create policy "user_lesson_progress_own_insert"
  on public.user_lesson_progress
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_lesson_progress_own_update" on public.user_lesson_progress;
create policy "user_lesson_progress_own_update"
  on public.user_lesson_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_lesson_progress_own_delete" on public.user_lesson_progress;
create policy "user_lesson_progress_own_delete"
  on public.user_lesson_progress
  for delete
  using (auth.uid() = user_id);
