-- School SaaS starter schema (MVP)
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Master data
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (class_id, name)
);

-- Students
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  admission_no text unique,
  first_name text not null,
  last_name text,
  gender text check (gender in ('male', 'female', 'other')),
  dob date,
  class_id uuid references public.classes (id) on delete set null,
  section_id uuid references public.sections (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive', 'graduated', 'transferred')),
  address text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists students_created_at_idx on public.students (created_at desc);
create index if not exists students_name_idx on public.students (first_name, last_name);
create index if not exists students_admission_no_idx on public.students (admission_no);

-- Guardians
create table if not exists public.guardians (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  name text not null,
  relation text not null check (relation in ('father', 'mother', 'guardian', 'other')),
  phone text,
  email text,
  occupation text,
  address text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists guardians_student_idx on public.guardians (student_id);

-- Attendance
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'leave')),
  marked_at timestamptz not null default now(),
  unique (student_id, date)
);

create index if not exists attendance_records_date_idx on public.attendance_records (date);
create index if not exists attendance_records_student_date_idx on public.attendance_records (student_id, date);

-- Fees (simple "invoice" model for now)
create table if not exists public.fee_invoices (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  title text not null default 'Fees',
  amount numeric(12,2) not null,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'paid', 'partial', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists fee_invoices_status_idx on public.fee_invoices (status);
create index if not exists fee_invoices_student_idx on public.fee_invoices (student_id);

-- Events / Calendar
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists events_start_at_idx on public.events (start_at);

-- Seed (optional)
insert into public.classes (name, sort_order)
values ('Class 1', 1), ('Class 2', 2), ('Class 3', 3), ('Class 4', 4), ('Class 5', 5), ('Class 6', 6), ('Class 7', 7), ('Class 8', 8), ('Class 9', 9), ('Class 10', 10), ('Class 11', 11), ('Class 12', 12)
on conflict (name) do nothing;

-- Seed sections for Class 1
insert into public.sections (class_id, name)
select id, 'A' from public.classes where name = 'Class 1'
union all
select id, 'B' from public.classes where name = 'Class 1'
on conflict (class_id, name) do nothing;

