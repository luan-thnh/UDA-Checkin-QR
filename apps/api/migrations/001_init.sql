-- P1 Postgres schema (Supabase/Neon). Áp dụng sau khi P0 memory chạy ổn.
-- Skill: supabase-postgres-best-practices

create table if not exists students (
  student_code text primary key,
  full_name text not null,
  class_name text not null,
  subject text,
  faculty text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id text primary key,
  title text not null,
  subject text,
  lat_center double precision not null,
  lng_center double precision not null,
  radius_m integer not null default 2000 check (radius_m between 50 and 10000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists sessions_status_ends_idx on sessions (status, ends_at);

create table if not exists attendances (
  id text primary key,
  session_id text not null references sessions(id) on delete cascade,
  student_code text not null references students(student_code) on delete restrict,
  checked_at timestamptz not null default now(),
  distance_m integer not null,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now(),
  unique (session_id, student_code)
);
create index if not exists attendances_session_idx on attendances (session_id);
