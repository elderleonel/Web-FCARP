create extension if not exists "pgcrypto";

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null,
  "totalHours" integer not null check ("totalHours" > 0),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.professors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text not null,
  city text not null,
  state text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  professor_id uuid not null references public.professors(id) on delete cascade,
  module_title text not null,
  start_date date not null,
  end_date date not null,
  start_time time not null,
  end_time time not null,
  weekdays integer not null default 5 check (weekdays > 0),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.file_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  path text not null unique,
  original_name text not null,
  content_type text,
  size_bytes bigint,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.courses enable row level security;
alter table public.professors enable row level security;
alter table public.allocations enable row level security;
alter table public.file_uploads enable row level security;

drop policy if exists "public can read courses" on public.courses;
create policy "public can read courses"
on public.courses for select
to anon, authenticated
using (true);

drop policy if exists "authenticated can manage courses" on public.courses;
create policy "authenticated can manage courses"
on public.courses for all
to authenticated
using (true)
with check (true);

drop policy if exists "public can read professors" on public.professors;
create policy "public can read professors"
on public.professors for select
to anon, authenticated
using (true);

drop policy if exists "authenticated can manage professors" on public.professors;
create policy "authenticated can manage professors"
on public.professors for all
to authenticated
using (true)
with check (true);

drop policy if exists "public can read allocations" on public.allocations;
create policy "public can read allocations"
on public.allocations for select
to anon, authenticated
using (true);

drop policy if exists "authenticated can manage allocations" on public.allocations;
create policy "authenticated can manage allocations"
on public.allocations for all
to authenticated
using (true)
with check (true);

drop policy if exists "user reads own file metadata" on public.file_uploads;
create policy "user reads own file metadata"
on public.file_uploads for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user inserts own file metadata" on public.file_uploads;
create policy "user inserts own file metadata"
on public.file_uploads for insert
to authenticated
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('private-files', 'private-files', false)
on conflict (id) do nothing;

drop policy if exists "user uploads own files" on storage.objects;
create policy "user uploads own files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'private-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "user reads own files" on storage.objects;
create policy "user reads own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'private-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);
