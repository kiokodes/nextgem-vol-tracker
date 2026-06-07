-- NextGem Foundation — Volunteer Tracker
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor)

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── ORPHANAGES ───────────────────────────────────────────────────────────────
create table if not exists orphanages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  qr_code_token text not null unique,
  created_at timestamptz default now()
);

-- ─── VOLUNTEERS ───────────────────────────────────────────────────────────────
create table if not exists volunteers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nysc_code text not null,
  orphanage_id uuid references orphanages(id) on delete cascade,
  created_at timestamptz default now()
);

-- ─── SESSIONS ─────────────────────────────────────────────────────────────────
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid references volunteers(id) on delete cascade,
  orphanage_id uuid references orphanages(id) on delete cascade,
  check_in_time timestamptz not null,
  check_out_time timestamptz,
  date date not null,
  hours numeric(5,2),
  created_at timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- Allow public read (so the scan page can load volunteers)
-- Allow public insert/update on sessions (for check-in/out)

alter table orphanages enable row level security;
alter table volunteers enable row level security;
alter table sessions enable row level security;

-- Orphanages: anyone can read
create policy "Public read orphanages"
  on orphanages for select using (true);

-- Volunteers: anyone can read
create policy "Public read volunteers"
  on volunteers for select using (true);

-- Sessions: anyone can read, insert, update
create policy "Public read sessions"
  on sessions for select using (true);

create policy "Public insert sessions"
  on sessions for insert with check (true);

create policy "Public update sessions"
  on sessions for update using (true);

-- Orphanages / Volunteers: admin insert (via service role from dashboard)
create policy "Service role insert orphanages"
  on orphanages for insert with check (true);

create policy "Service role insert volunteers"
  on volunteers for insert with check (true);

-- ─── SAMPLE DATA (optional — remove before production) ────────────────────────
-- insert into orphanages (name, qr_code_token) values
--   ('Hope House Orphanage', 'hope-house-01'),
--   ('Grace Children Home', 'grace-children-01');

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
create index if not exists sessions_volunteer_date on sessions(volunteer_id, date);
create index if not exists sessions_orphanage_date on sessions(orphanage_id, date);
create index if not exists orphanages_token on orphanages(qr_code_token);
