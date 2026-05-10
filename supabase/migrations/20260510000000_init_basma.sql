-- =====================================================================
-- Basma — Biometric & Geofenced Attendance SaaS
-- Initial schema with RLS + anti-fraud constraints + RPC helpers
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. ORGANIZATIONS
-- ---------------------------------------------------------------------
create table if not exists public.organizations (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  subscription_plan text not null default 'free'
                    check (subscription_plan in ('free', 'pro', 'enterprise')),
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. WORKPLACES (geofence anchors)
-- ---------------------------------------------------------------------
create table if not exists public.workplaces (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  name       text not null,
  latitude   double precision not null check (latitude  between -90  and  90),
  longitude  double precision not null check (longitude between -180 and 180),
  radius     integer not null default 50 check (radius between 10 and 5000), -- meters
  created_at timestamptz not null default now()
);

create index if not exists workplaces_org_idx on public.workplaces(org_id);

-- ---------------------------------------------------------------------
-- 3. PROFILES (mirrors auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  org_id             uuid references public.organizations(id) on delete set null,
  email              text unique not null,
  full_name          text,
  role               text not null default 'employee'
                     check (role in ('admin', 'employee')),
  workplace_id       uuid references public.workplaces(id) on delete set null,
  biometric_token_id text, -- opaque device-bound credential id (WebAuthn / Platform Authenticator)
  created_at         timestamptz not null default now()
);

create index if not exists profiles_org_idx       on public.profiles(org_id);
create index if not exists profiles_workplace_idx on public.profiles(workplace_id);

-- ---------------------------------------------------------------------
-- 4. ATTENDANCE LOGS
-- ---------------------------------------------------------------------
create table if not exists public.attendance_logs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  workplace_id       uuid references public.workplaces(id) on delete set null,
  type               text not null check (type in ('in', 'out')),
  -- IMPORTANT: server-side timestamp only — we NEVER trust client clocks
  timestamp          timestamptz not null default now(),
  location_snapshot  jsonb not null, -- { lat, lng, accuracy, distance_m }
  device_info        jsonb,          -- { ua, platform, vendor }
  is_verified        boolean not null default false,
  fraud_signals      jsonb,          -- { mock_location, vpn, proxy, clock_skew_ms }
  created_at         timestamptz not null default now()
);

create index if not exists attendance_user_idx    on public.attendance_logs(user_id, timestamp desc);
create index if not exists attendance_org_day_idx on public.attendance_logs(workplace_id, timestamp desc);

-- ---------------------------------------------------------------------
-- 5. TRIGGER: auto-create profile on auth signup
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 6. RPC: server_now — authoritative time source
-- ---------------------------------------------------------------------
create or replace function public.server_now()
returns timestamptz
language sql
stable
as $$ select now(); $$;

-- ---------------------------------------------------------------------
-- 7. RPC: haversine_distance_m (fallback; we also compute client-side)
-- ---------------------------------------------------------------------
create or replace function public.haversine_distance_m(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) returns double precision
language plpgsql
immutable
as $$
declare
  r constant double precision := 6371000; -- Earth radius in meters
  dlat double precision;
  dlon double precision;
  a    double precision;
  c    double precision;
begin
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat / 2) ^ 2
     + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ^ 2;
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  return r * c;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. RPC: clock_event — secure in/out with server-side geofence check
-- ---------------------------------------------------------------------
create or replace function public.clock_event(
  p_type             text,
  p_latitude         double precision,
  p_longitude        double precision,
  p_accuracy         double precision,
  p_device_info      jsonb,
  p_fraud_signals    jsonb
)
returns public.attendance_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile      public.profiles%rowtype;
  v_workplace    public.workplaces%rowtype;
  v_distance     double precision;
  v_is_verified  boolean;
  v_row          public.attendance_logs%rowtype;
  v_mock         boolean;
  v_vpn          boolean;
begin
  if p_type not in ('in', 'out') then
    raise exception 'invalid clock type: %', p_type using errcode = '22023';
  end if;

  -- Load profile (must be authenticated)
  select * into v_profile from public.profiles where id = auth.uid();
  if not found then
    raise exception 'profile not found' using errcode = '42501';
  end if;

  if v_profile.workplace_id is null then
    raise exception 'user has no assigned workplace' using errcode = '22023';
  end if;

  select * into v_workplace from public.workplaces where id = v_profile.workplace_id;
  if not found then
    raise exception 'workplace not found' using errcode = '22023';
  end if;

  -- Anti-cheat: reject mock location / VPN outright
  v_mock := coalesce((p_fraud_signals->>'mock_location')::boolean, false);
  v_vpn  := coalesce((p_fraud_signals->>'vpn')::boolean, false);
  if v_mock then
    raise exception 'mock location detected' using errcode = '42501';
  end if;

  -- Server-side geofence check (authoritative)
  v_distance := public.haversine_distance_m(
    v_workplace.latitude, v_workplace.longitude,
    p_latitude, p_longitude
  );

  v_is_verified := (v_distance <= v_workplace.radius) and not v_mock and not v_vpn;

  if not v_is_verified then
    raise exception 'outside geofence: % m > % m', round(v_distance)::int, v_workplace.radius
      using errcode = '42501';
  end if;

  insert into public.attendance_logs (
    user_id, workplace_id, type, location_snapshot, device_info, is_verified, fraud_signals
  )
  values (
    v_profile.id,
    v_workplace.id,
    p_type,
    jsonb_build_object(
      'lat', p_latitude,
      'lng', p_longitude,
      'accuracy', p_accuracy,
      'distance_m', round(v_distance)::int
    ),
    p_device_info,
    v_is_verified,
    p_fraud_signals
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------
-- 9. VIEW: daily_attendance_summary (for admin dashboard + overtime)
--    Jordanian Labor Law standard: 8h regular workday, anything above = overtime.
-- ---------------------------------------------------------------------
create or replace view public.daily_attendance_summary as
with paired as (
  select
    p.id           as user_id,
    p.full_name,
    p.email,
    p.org_id,
    p.workplace_id,
    date_trunc('day', l.timestamp) as work_day,
    min(l.timestamp) filter (where l.type = 'in')  as clock_in,
    max(l.timestamp) filter (where l.type = 'out') as clock_out,
    max((l.location_snapshot->>'distance_m')::int) filter (where l.type = 'in') as distance_m
  from public.profiles p
  left join public.attendance_logs l
    on l.user_id = p.id and l.is_verified = true
  group by p.id, p.full_name, p.email, p.org_id, p.workplace_id, date_trunc('day', l.timestamp)
)
select
  user_id,
  full_name,
  email,
  org_id,
  workplace_id,
  work_day,
  clock_in,
  clock_out,
  distance_m,
  case
    when clock_in is not null and clock_out is not null
      then round(extract(epoch from (clock_out - clock_in))::numeric / 3600.0, 2)
    else 0
  end as total_hours,
  case
    when clock_in is not null and clock_out is not null
      then greatest(
        round(extract(epoch from (clock_out - clock_in))::numeric / 3600.0, 2) - 8,
        0
      )
    else 0
  end as overtime_hours,
  case
    when clock_in is not null and clock_out is null then 'present'
    when clock_in is not null and clock_out is not null then 'completed'
    else 'absent'
  end as status
from paired;

-- ---------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.organizations    enable row level security;
alter table public.workplaces       enable row level security;
alter table public.profiles         enable row level security;
alter table public.attendance_logs  enable row level security;

-- profiles ------------------------------------------------------------
drop policy if exists "profiles_self_select"      on public.profiles;
drop policy if exists "profiles_admin_select_org" on public.profiles;
drop policy if exists "profiles_self_update"      on public.profiles;

create policy "profiles_self_select"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_admin_select_org"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role = 'admin'
        and me.org_id = public.profiles.org_id
    )
  );

create policy "profiles_self_update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- organizations -------------------------------------------------------
drop policy if exists "org_members_select" on public.organizations;
create policy "org_members_select"
  on public.organizations for select
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.org_id = public.organizations.id
    )
  );

-- workplaces ----------------------------------------------------------
drop policy if exists "workplaces_org_select" on public.workplaces;
drop policy if exists "workplaces_admin_write" on public.workplaces;

create policy "workplaces_org_select"
  on public.workplaces for select
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.org_id = public.workplaces.org_id
    )
  );

create policy "workplaces_admin_write"
  on public.workplaces for all
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role = 'admin'
        and me.org_id = public.workplaces.org_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role = 'admin'
        and me.org_id = public.workplaces.org_id
    )
  );

-- attendance_logs -----------------------------------------------------
drop policy if exists "attendance_self_select"  on public.attendance_logs;
drop policy if exists "attendance_admin_select" on public.attendance_logs;

-- Writes go exclusively through clock_event() RPC (security definer).
-- We do NOT expose direct INSERT to clients.
create policy "attendance_self_select"
  on public.attendance_logs for select
  using (user_id = auth.uid());

create policy "attendance_admin_select"
  on public.attendance_logs for select
  using (
    exists (
      select 1
      from public.profiles me
      join public.profiles target on target.id = public.attendance_logs.user_id
      where me.id = auth.uid()
        and me.role = 'admin'
        and me.org_id = target.org_id
    )
  );

-- Grants --------------------------------------------------------------
grant execute on function public.server_now()           to anon, authenticated;
grant execute on function public.clock_event(text, double precision, double precision, double precision, jsonb, jsonb) to authenticated;
grant select on public.daily_attendance_summary to authenticated;
