create table if not exists public.student_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  summary text not null default '',
  tech_stack text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.student_projects (id) on delete cascade,
  description text not null check (char_length(trim(description)) between 1 and 4000),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'done')),
  evidence text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.student_projects (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  details text not null default '',
  start_date date,
  due_date date,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'done')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_milestones
  add column if not exists start_date date;

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.student_projects (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 20000),
  created_at timestamptz not null default now()
);

create index if not exists project_requirements_project_idx
  on public.project_requirements (project_id, created_at);
create index if not exists project_milestones_project_idx
  on public.project_milestones (project_id, position);
create index if not exists project_messages_project_created_idx
  on public.project_messages (project_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as 'begin new.updated_at = now(); return new; end;';

drop trigger if exists student_projects_set_updated_at on public.student_projects;
create trigger student_projects_set_updated_at
  before update on public.student_projects
  for each row execute function public.set_updated_at();

drop trigger if exists project_requirements_set_updated_at on public.project_requirements;
create trigger project_requirements_set_updated_at
  before update on public.project_requirements
  for each row execute function public.set_updated_at();

drop trigger if exists project_milestones_set_updated_at on public.project_milestones;
create trigger project_milestones_set_updated_at
  before update on public.project_milestones
  for each row execute function public.set_updated_at();

alter table public.student_projects enable row level security;
alter table public.project_requirements enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_messages enable row level security;

drop policy if exists student_projects_owner_access on public.student_projects;
create policy student_projects_owner_access
  on public.student_projects for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists project_requirements_owner_access on public.project_requirements;
create policy project_requirements_owner_access
  on public.project_requirements for all to authenticated
  using (
    exists (
      select 1 from public.student_projects p
      where p.id = project_id and p.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.student_projects p
      where p.id = project_id and p.owner_id = (select auth.uid())
    )
  );

drop policy if exists project_milestones_owner_access on public.project_milestones;
create policy project_milestones_owner_access
  on public.project_milestones for all to authenticated
  using (
    exists (
      select 1 from public.student_projects p
      where p.id = project_id and p.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.student_projects p
      where p.id = project_id and p.owner_id = (select auth.uid())
    )
  );

drop policy if exists project_messages_owner_access on public.project_messages;
create policy project_messages_owner_access
  on public.project_messages for all to authenticated
  using (
    exists (
      select 1 from public.student_projects p
      where p.id = project_id and p.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.student_projects p
      where p.id = project_id and p.owner_id = (select auth.uid())
    )
  );

grant select, insert, update, delete
  on public.student_projects, public.project_requirements,
     public.project_milestones, public.project_messages
  to authenticated;
revoke all
  on public.student_projects, public.project_requirements,
     public.project_milestones, public.project_messages
  from anon, public;