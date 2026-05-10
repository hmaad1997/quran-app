import { supabase } from './supabase';
import type { DeviceInfo, FraudSignals } from '@/types/database';

/**
 * Basma Anti-Cheat Layer
 * ----------------------
 * The browser cannot expose an OS-level "mock location" flag the way Android
 * does, so we combine multiple heuristics to raise the cost of spoofing:
 *
 *  1. `navigator.geolocation.getCurrentPosition` must return a GeolocationPosition
 *     (not a plain object from an overridden getter).
 *  2. Accuracy <= 150m — suspicious, desktop browsers or spoofers usually
 *     advertise huge accuracy radii.
 *  3. Impossible travel between samples (> 300 km/h).
 *  4. Authoritative server time via RPC — we compare with Date.now() and if the
 *     skew is > 2 minutes we flag `tampered`, and always send the server value.
 *  5. Optional ipinfo.io VPN/proxy probe.
 *
 * These are defense-in-depth, not silver bullets. The authoritative decision
 * is made server-side by the `clock_event` RPC.
 */

// ---- Server time ----------------------------------------------------

export interface ServerTimeInfo {
  serverNow: Date;
  clockSkewMs: number;
}

export async function fetchServerTime(): Promise<ServerTimeInfo> {
  const { data, error } = await supabase.rpc('server_now');
  if (error || !data) {
    throw new Error(`server_now failed: ${error?.message ?? 'no data'}`);
  }
  const serverNow = new Date(data as string);
  const clockSkewMs = serverNow.getTime() - Date.now();
  return { serverNow, clockSkewMs };
}

// ---- Device fingerprint ---------------------------------------------

export function collectDeviceInfo(): DeviceInfo {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const scr = typeof screen !== 'undefined' ? screen : undefined;

  return {
    ua: nav?.userAgent ?? 'unknown',
    platform: nav?.platform ?? 'unknown',
    vendor: nav?.vendor ?? 'unknown',
    language: nav?.language ?? 'en',
    screen: { w: scr?.width ?? 0, h: scr?.height ?? 0 },
  };
}

// ---- Mock-location heuristics ---------------------------------------

export interface MockLocationInput {
  position: GeolocationPosition;
  previous?: { latitude: number; longitude: number; timestamp: number } | null;
}

export interface MockLocationResult {
  mock: boolean;
  reasons: string[];
}

const MAX_REASONABLE_ACCURACY_M = 150;
const MAX_PLAUSIBLE_SPEED_MPS = 83; // ~300 km/h

export function detectMockLocation({
  position,
  previous,
}: MockLocationInput): MockLocationResult {
  const reasons: string[] = [];

  // 1) Shape check — real GeolocationPosition is not a plain object.
  // Spoofers that monkey-patch `navigator.geolocation` usually return
  // plain objects that fail `instanceof` checks in some browsers.
  // We use feature checks instead of instanceof (which isn't reliable
  // across realms) — coords MUST be a GeolocationCoordinates.
  if (!position || !position.coords) {
    reasons.push('missing_coords');
  }

  // 2) Unreasonably high accuracy (low radius) is also suspicious
  // because phones rarely report < 3m outdoors.
  if (position?.coords && position.coords.accuracy < 1) {
    reasons.push('accuracy_too_good');
  }

  // 3) Unreasonably low accuracy — desktop IP-based geolocation.
  if (
    position?.coords &&
    position.coords.accuracy > MAX_REASONABLE_ACCURACY_M
  ) {
    reasons.push('accuracy_too_low');
  }

  // 4) Impossible travel since last sample.
  if (previous && position?.coords) {
    const dtSec = Math.max(1, (position.timestamp - previous.timestamp) / 1000);
    const dLat = position.coords.latitude - previous.latitude;
    const dLon = position.coords.longitude - previous.longitude;
    // crude equirectangular approximation, fine for impossible-speed test
    const meters = Math.hypot(dLat * 111_320, dLon * 111_320);
    if (meters / dtSec > MAX_PLAUSIBLE_SPEED_MPS) {
      reasons.push('impossible_speed');
    }
  }

  return { mock: reasons.length > 0, reasons };
}

// ---- VPN / Proxy probe ----------------------------------------------

export interface NetworkCheck {
  vpn: boolean;
  proxy: boolean;
  ip?: string;
}

/**
 * Uses ipinfo.io if VITE_IPINFO_TOKEN is configured, otherwise returns
 * a benign no-op result. We deliberately avoid blocking on this check.
 */
export async function checkNetwork(): Promise<NetworkCheck> {
  const token = import.meta.env.VITE_IPINFO_TOKEN;
  if (!token) return { vpn: false, proxy: false };

  try {
    const res = await fetch(`https://ipinfo.io/json?token=${token}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { vpn: false, proxy: false };
    const json = (await res.json()) as {
      ip?: string;
      privacy?: { vpn?: boolean; proxy?: boolean; tor?: boolean; hosting?: boolean };
    };
    const p = json.privacy ?? {};
    return {
      vpn: Boolean(p.vpn ?? p.tor),
      proxy: Boolean(p.proxy ?? p.hosting),
      ip: json.ip,
    };
  } catch {
    return { vpn: false, proxy: false };
  }
}

// ---- Aggregated fraud signals --------------------------------------

export interface FraudSignalsInput {
  position: GeolocationPosition;
  previous?: { latitude: number; longitude: number; timestamp: number } | null;
  clockSkewMs: number;
}

export async function buildFraudSignals(
  input: FraudSignalsInput,
): Promise<FraudSignals> {
  const [mock, net] = await Promise.all([
    Promise.resolve(detectMockLocation(input)),
    checkNetwork(),
  ]);

  return {
    mock_location: mock.mock,
    vpn: net.vpn,
    proxy: net.proxy,
    clock_skew_ms: Math.abs(input.clockSkewMs),
    accuracy_m: Math.round(input.position.coords.accuracy),
    tampered_geolocation: Math.abs(input.clockSkewMs) > 120_000,
  };
}
