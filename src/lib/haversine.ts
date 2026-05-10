/**
 * Great-circle distance between two WGS-84 coordinates, in meters.
 *
 * Uses the Haversine formula. Accuracy is well within a few meters for
 * typical geofencing radii (< 5 km) — which is all we need for workplaces.
 */
export interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

export function haversineDistance(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface GeofenceResult {
  /** distance to the center, in meters, rounded */
  distance: number;
  /** true when the user is inside `radius` */
  inside: boolean;
}

export function checkGeofence(
  user: LatLng,
  center: LatLng,
  radius: number,
): GeofenceResult {
  const distance = Math.round(haversineDistance(user, center));
  return { distance, inside: distance <= radius };
}
