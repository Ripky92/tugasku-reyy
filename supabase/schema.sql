-- Jalankan seluruh isi file ini di Supabase > SQL Editor.
-- GANTI email di bawah dengan email akun admin Anda.

create or replace function public.is_owner() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'GANTI_DENGAN_EMAIL_ANDA@example.com'
$$;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  category text not null default 'Umum',
  task_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  path text not null,
  name text not null,
  mime text not null default '',
  size bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
alter table public.task_files enable row level security;

create policy "tasks read" on public.tasks for select using (true);
create policy "tasks write" on public.tasks for all using (public.is_owner()) with check (public.is_owner());
create policy "files read" on public.task_files for select using (true);
create policy "files write" on public.task_files for all using (public.is_owner()) with check (public.is_owner());

insert into storage.buckets (id, name, public, file_size_limit)
values ('tasks', 'tasks', true, 52428800)
on conflict (id) do nothing;

create policy "storage read" on storage.objects for select using (bucket_id = 'tasks');
create policy "storage insert" on storage.objects for insert with check (bucket_id = 'tasks' and public.is_owner());
create policy "storage update" on storage.objects for update using (bucket_id = 'tasks' and public.is_owner());
create policy "storage delete" on storage.objects for delete using (bucket_id = 'tasks' and public.is_owner());
