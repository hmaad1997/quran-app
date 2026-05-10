import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  buildFraudSignals,
  collectDeviceInfo,
  fetchServerTime,
} from '@/lib/antiCheat';
import { requireBiometric } from '@/lib/biometric';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import type { AttendanceLog, AttendanceType } from '@/types/database';

export type AttendancePhase =
  | 'idle'
  | 'verifying_time'
  | 'verifying_biometric'
  | 'submitting'
  | 'success'
  | 'error';

export interface UseAttendanceReturn {
  phase: AttendancePhase;
  lastEvent: AttendanceLog | null;
  todayLogs: AttendanceLog[];
  /** most recent event type — tells us whether the next action is 'in' or 'out' */
  nextAction: AttendanceType;
  error: string | null;
  canClock: boolean;
  blockedReason: string | null;
  clock: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * useAttendance — dual-verification attendance hook.
 *
 * Flow when clock() is called:
 *   1. Guard: location available + inside geofence + no mock-location flags.
 *   2. Fetch authoritative server time (server_now RPC) → clock_skew_ms.
 *   3. Trigger WebAuthn platform authenticator (FaceID / Touch ID / fingerprint).
 *   4. Build fraud_signals payload (mock_location, vpn, proxy, clock_skew, ...).
 *   5. Call the `clock_event` RPC — server re-runs the geofence check and
 *      writes the attendance row with a server-side timestamp.
 */
export function useAttendance(): UseAttendanceReturn {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const current = useLocationStore((s) => s.current);
  const inside = useLocationStore((s) => s.insideGeofence);
  const mock = useLocationStore((s) => s.mock);
  const mockReasons = useLocationStore((s) => s.mockReasons);
  const status = useLocationStore((s) => s.status);

  const [phase, setPhase] = useState<AttendancePhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<AttendanceLog | null>(null);
  const [todayLogs, setTodayLogs] = useState<AttendanceLog[]>([]);

  const refresh = useCallback(async (): Promise<void> => {
    if (!user) return;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data, error: err } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('timestamp', startOfDay.toISOString())
      .order('timestamp', { ascending: false });

    if (err) {
      // eslint-disable-next-line no-console
      console.error('[useAttendance] refresh', err);
      return;
    }
    const logs = (data ?? []) as AttendanceLog[];
    setTodayLogs(logs);
    setLastEvent(logs[0] ?? null);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const nextAction: AttendanceType = lastEvent?.type === 'in' ? 'out' : 'in';

  const blockedReason = (() => {
    if (!profile?.workplace_id) return 'لا يوجد موقع عمل مرتبط بحسابك';
    if (status === 'denied') return 'يجب السماح بصلاحية الموقع';
    if (status === 'unavailable') return 'الجهاز لا يدعم تحديد الموقع';
    if (!current) return 'جاري تحديد موقعك...';
    if (mock) return `تم اكتشاف موقع غير حقيقي (${mockReasons.join(', ')})`;
    if (!inside) return 'أنت خارج نطاق موقع العمل';
    return null;
  })();

  const canClock = blockedReason === null && phase !== 'submitting';

  const clock = useCallback(async (): Promise<void> => {
    if (!user || !profile || !current) {
      setError('المستخدم أو الموقع غير جاهز');
      setPhase('error');
      return;
    }
    setError(null);

    try {
      // 1) Authoritative time
      setPhase('verifying_time');
      const { clockSkewMs } = await fetchServerTime();

      // 2) Biometric gate
      setPhase('verifying_biometric');
      const bio = await requireBiometric({
        userId: user.id,
        userName: profile.full_name ?? profile.email,
      });
      if (!bio.ok) {
        throw new Error(`فشل التحقق البيومتري: ${bio.reason ?? 'unknown'}`);
      }

      // 3) Build fraud signals payload
      const posLike = {
        coords: {
          latitude: current.latitude,
          longitude: current.longitude,
          accuracy: current.accuracy,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON() {
            return this;
          },
        } as GeolocationCoordinates,
        timestamp: current.timestamp,
        toJSON() {
          return this;
        },
      } as GeolocationPosition;

      const fraud = await buildFraudSignals({
        position: posLike,
        previous: null,
        clockSkewMs,
      });

      // 4) Call the secure RPC
      setPhase('submitting');
      const { data, error: rpcErr } = await supabase.rpc('clock_event', {
        p_type: nextAction,
        p_latitude: current.latitude,
        p_longitude: current.longitude,
        p_accuracy: current.accuracy,
        p_device_info: collectDeviceInfo(),
        p_fraud_signals: fraud,
      });

      if (rpcErr) throw new Error(rpcErr.message);

      setLastEvent(data as AttendanceLog);
      setPhase('success');
      await refresh();
      setTimeout(() => setPhase('idle'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      setPhase('error');
      setTimeout(() => setPhase('idle'), 2500);
    }
  }, [user, profile, current, nextAction, refresh]);

  return {
    phase,
    lastEvent,
    todayLogs,
    nextAction,
    error,
    canClock,
    blockedReason,
    clock,
    refresh,
  };
}
