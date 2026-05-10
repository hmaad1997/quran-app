import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';

/**
 * LocationProvider
 * ----------------
 * Mounts once at the app root. It:
 *  1. Starts watching the device location (high-accuracy) as soon as a user
 *     is authenticated.
 *  2. Recomputes the geofence distance every time either the location sample
 *     or the user's assigned workplace changes.
 *  3. Stops watching on unmount / sign-out to save battery.
 */
export function LocationProvider({ children }: { children: ReactNode }): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const workplace = useAuthStore((s) => s.workplace);

  const startWatching = useLocationStore((s) => s.startWatching);
  const stopWatching = useLocationStore((s) => s.stopWatching);
  const refreshGeofence = useLocationStore((s) => s.refreshGeofence);
  const current = useLocationStore((s) => s.current);

  useEffect(() => {
    if (!user) {
      stopWatching();
      return;
    }
    void startWatching();
    return () => stopWatching();
  }, [user, startWatching, stopWatching]);

  useEffect(() => {
    if (!workplace) {
      refreshGeofence(null, 0);
      return;
    }
    refreshGeofence(
      { latitude: workplace.latitude, longitude: workplace.longitude },
      workplace.radius,
    );
  }, [current, workplace, refreshGeofence]);

  return <>{children}</>;
}
