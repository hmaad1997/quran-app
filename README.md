# Basma — Biometric & Geofenced Attendance SaaS

Production-ready MVP for a biometric + geofenced attendance system, built
with a heavy anti-fraud stance and a FinTech-grade dark UI.

> Repository name is `quran-app` for historical reasons; the product is **Basma**.

## Stack

- **Frontend:** React 18 + TypeScript (strict) + Vite 5
- **Styling:** Tailwind CSS 3 + custom glassmorphism utilities
- **Animation:** Framer Motion 11
- **Icons:** lucide-react
- **State:** Zustand 4 (with `persist` middleware)
- **Backend:** Supabase (PostgreSQL + Auth + RPC + RLS)
- **Biometric gate:** WebAuthn Platform Authenticator (FaceID / TouchID / fingerprint)

## Color palette

| Role | Value |
| --- | --- |
| Deep Navy (bg) | `#0A192F` |
| Electric Blue (accent) | `#0070F3` |
| Success | `#10B981` |
| Danger | `#EF4444` |
| Warning | `#F59E0B` |

## Project layout

```
src/
  App.tsx                  # routes + auth bootstrap
  main.tsx                 # React entry
  components/
    layout/
      AppShell.tsx         # top-nav shell with role-aware chips
      ProtectedRoute.tsx   # auth + role guard
    ui/
      BiometricBtn.tsx     # long-press glassmorphic scanner
      GlassCard.tsx        # motion fade-up glass container
      StatusCard.tsx       # in/out-of-zone live status card
  hooks/
    useAttendance.ts       # dual-verification orchestration
  lib/
    supabase.ts            # supabase-js client
    haversine.ts           # Haversine + geofence helpers
    antiCheat.ts           # server time, mock-location, VPN probes
    biometric.ts           # WebAuthn enrollment + assertion
    format.ts              # UI formatters
  pages/
    Login.tsx
    Signup.tsx
    EmployeeDashboard.tsx  # biometric clock-in/out
    AdminDashboard.tsx     # daily summary + overtime (JO labor law)
  providers/
    LocationProvider.tsx   # watchPosition + geofence recompute
  store/
    authStore.ts           # session + profile + workplace
    locationStore.ts       # live location + mock-location detection
  types/
    database.ts            # hand-typed DB DTOs
  styles/
    globals.css            # Tailwind + glass utilities
supabase/
  migrations/
    20260510000000_init_basma.sql
  seed.sql
```

## Database schema

| Table | Purpose |
| --- | --- |
| `organizations` | Tenant, subscription plan |
| `workplaces` | Geofence anchor (lat, lng, radius) — default 50 m |
| `profiles` | Mirrors `auth.users`; role = admin / employee; `biometric_token_id` |
| `attendance_logs` | `type`, server-side `timestamp`, `location_snapshot`, `device_info`, `is_verified`, `fraud_signals` |

### Anti-fraud surface

- **`server_now()`** RPC → authoritative time. Clients never trust
  `Date.now()` for attendance decisions.
- **`clock_event()`** `security definer` RPC:
  - rejects requests where `fraud_signals.mock_location = true`
  - recomputes `haversine_distance_m()` against the workplace anchor
  - inserts the row with `timestamp = now()` (server time)
  - **direct `INSERT` on `attendance_logs` is not exposed** via RLS.
- **`daily_attendance_summary`** view → per-day `total_hours`,
  `overtime_hours = max(total - 8, 0)` (Jordanian labor law baseline).

### RLS summary

- `profiles`: self select / update, admins select org peers.
- `workplaces`: org members select, admins write.
- `attendance_logs`: self select, org admins select. Writes via RPC only.

## Running locally

```bash
cp .env.example .env
#   fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
#   and (optionally) VITE_IPINFO_TOKEN for VPN detection.

npm install
npm run dev
```

Apply the schema with the Supabase CLI:

```bash
supabase db push
#  or, for a hosted project:
supabase db execute --file supabase/migrations/20260510000000_init_basma.sql
supabase db execute --file supabase/seed.sql   # dev only
```

## Anti-fraud playbook

1. Browser geolocation must return a `GeolocationPosition` with accuracy
   in `[1, 150]` meters. Values outside the band are flagged as
   `accuracy_too_good` or `accuracy_too_low`.
2. Sample-to-sample distance / time > 83 m/s (~300 km/h) →
   `impossible_speed`.
3. Server time vs. client time skew > 120 s →
   `tampered_geolocation` (still submitted, visible in admin audit).
4. `ipinfo.io` privacy flags → `vpn` / `proxy` booleans.
5. **All decisions re-validated server-side inside `clock_event`.**

## Biometric flow

- On first attempt, `requireBiometric()` enrolls a platform-bound
  credential with `userVerification: 'required'`, `residentKey:
  'preferred'`.
- Subsequent attempts perform a `navigator.credentials.get()` assertion
  against the stored `credentialId`. No biometric data ever leaves the
  device.

## UX details

- **Long-press interaction:** press and hold the scanner for 1.5 s.
  A circular SVG ring fills; on completion we trigger the biometric
  prompt, then call the RPC. Releasing early resets progress.
- **Pulse rings:** two `animate-pulse-ring` spans signal idle readiness.
- **Phase overlays:** loader → check → cross with Framer Motion cross-fade.
- **Status card:** color-shifts between `success` (inside) and `danger`
  (outside / mock-location suspected).

## TODO / next steps

- Admin CRUD for workplaces + employee assignments.
- Monthly export (CSV / PDF) of overtime.
- Realtime presence via `supabase.channel(...)`.
- Production hardening: sign the WebAuthn challenge server-side with a
  per-user `challenge` table.
