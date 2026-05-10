/**
 * Basma — Database types (hand-written to match the initial SQL migration).
 * Regenerate with `supabase gen types typescript` once the project is linked.
 */

export type UserRole = 'admin' | 'employee';
export type AttendanceType = 'in' | 'out';
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  subscription_plan: SubscriptionPlan;
  created_at: string;
}

export interface Workplace {
  id: string;
  org_id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** meters */
  radius: number;
  created_at: string;
}

export interface Profile {
  id: string;
  org_id: string | null;
  email: string;
  full_name: string | null;
  role: UserRole;
  workplace_id: string | null;
  biometric_token_id: string | null;
  created_at: string;
}

export interface LocationSnapshot {
  lat: number;
  lng: number;
  accuracy: number;
  distance_m: number;
}

export interface DeviceInfo {
  ua: string;
  platform: string;
  vendor: string;
  language: string;
  screen: { w: number; h: number };
}

export interface FraudSignals {
  mock_location: boolean;
  vpn: boolean;
  proxy: boolean;
  clock_skew_ms: number;
  accuracy_m: number;
  tampered_geolocation: boolean;
}

export interface AttendanceLog {
  id: string;
  user_id: string;
  workplace_id: string | null;
  type: AttendanceType;
  timestamp: string;
  location_snapshot: LocationSnapshot;
  device_info: DeviceInfo | null;
  is_verified: boolean;
  fraud_signals: FraudSignals | null;
  created_at: string;
}

export interface DailyAttendanceSummary {
  user_id: string;
  full_name: string | null;
  email: string;
  org_id: string | null;
  workplace_id: string | null;
  work_day: string;
  clock_in: string | null;
  clock_out: string | null;
  distance_m: number | null;
  total_hours: number;
  overtime_hours: number;
  status: 'present' | 'completed' | 'absent';
}
