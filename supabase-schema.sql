-- ============================================================
-- RouteWise Database Schema
-- Run this entire file in: Supabase → SQL Editor → New query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Drivers ──────────────────────────────────────────────────────────────────
create table public.drivers (
  id uuid references auth.users(id) on delete cascade primary key,
  phone text not null,
  name text not null default '',
  vehicle_type text not null default 'bike' check (vehicle_type in ('bike','auto','car','tempo')),
  created_at timestamptz not null default now()
);

alter table public.drivers enable row level security;

create policy "Driver can read own profile"
  on public.drivers for select
  using (auth.uid() = id);

create policy "Driver can update own profile"
  on public.drivers for update
  using (auth.uid() = id);

create policy "Driver can insert own profile"
  on public.drivers for insert
  with check (auth.uid() = id);

-- ─── Delivery Sessions ────────────────────────────────────────────────────────
create table public.delivery_sessions (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid references public.drivers(id) on delete cascade not null,
  date date not null,
  status text not null default 'planning' check (status in ('planning','active','completed')),
  total_distance_km numeric(8,2) not null default 0,
  optimized_distance_km numeric(8,2) not null default 0,
  fuel_saved_inr numeric(8,2) not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.delivery_sessions enable row level security;

create policy "Driver sees own sessions"
  on public.delivery_sessions for all
  using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);

-- ─── Stops ────────────────────────────────────────────────────────────────────
create table public.stops (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.delivery_sessions(id) on delete cascade not null,
  order_index integer not null default 0,
  customer_name text not null,
  address text not null,
  lat numeric(10,7) not null,
  lng numeric(10,7) not null,
  notes text,
  payment_type text not null default 'paid' check (payment_type in ('paid','cod')),
  cod_amount numeric(10,2),
  is_fragile boolean not null default false,
  status text not null default 'pending' check (status in ('pending','delivered','failed')),
  proof_photo_url text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.stops enable row level security;

create policy "Driver sees own stops"
  on public.stops for all
  using (
    auth.uid() = (
      select driver_id from public.delivery_sessions
      where id = stops.session_id
    )
  )
  with check (
    auth.uid() = (
      select driver_id from public.delivery_sessions
      where id = stops.session_id
    )
  );

-- ─── Storage bucket for proof photos ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('delivery-proofs', 'delivery-proofs', true)
on conflict do nothing;

create policy "Drivers can upload proof photos"
  on storage.objects for insert
  with check (bucket_id = 'delivery-proofs' and auth.role() = 'authenticated');

create policy "Proof photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'delivery-proofs');

-- ─── Indexes for performance ──────────────────────────────────────────────────
create index idx_sessions_driver_date on public.delivery_sessions(driver_id, date desc);
create index idx_stops_session on public.stops(session_id, order_index);

-- Done!
select 'RouteWise schema created successfully ✓' as result;
