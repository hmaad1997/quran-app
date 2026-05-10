import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { checkGeofence, type LatLng } from '@/lib/haversine';
import { detectMockLocation } from '@/lib/antiCheat';

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'watching'
  | 'denied'
  | 'unavailable'
  | 'error';

interface Sample {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationState {
  status: LocationStatus;
  error: string | null;
  current: Sample | null;
  previous: Sample | null;
  watchId: number | null;
  mock: boolean;
  mockReasons: string[];
  distanceToWorkplace: number | null;
  insideGeofence: boolean;

  startWatching: () => Promise<void>;
  stopWatching: () => void;
  refreshGeofence: (center: LatLng | null, radius: number) => void;
  reset: () => void;
}

const initial = {
  status: 'idle' as LocationStatus,
  error: null,
  current: null,
  previous: null,
  watchId: null,
  mock: false,
  mockReasons: [] as string[],
  distanceToWorkplace: null as number | null,
  insideGeofence: false,
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      ...initial,

      startWatching: async () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          set({ status: 'unavailable', error: 'Geolocation not supported' });
          return;
        }
        if (get().watchId !== null) return;

        set({ status: 'requesting', error: null });

        const onPos = (pos: GeolocationPosition): void => {
          const sample: Sample = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          };

          const mockCheck = detectMockLocation({
            position: pos,
            previous: get().current,
          });

          set((s) => ({
            status: 'watching',
            previous: s.current,
            current: sample,
            mock: mockCheck.mock,
            mockReasons: mockCheck.reasons,
            error: null,
          }));
        };

        const onErr = (err: GeolocationPositionError): void => {
          set({
            status: err.code === err.PERMISSION_DENIED ? 'denied' : 'error',
            error: err.message,
          });
        };

        const watchId = navigator.geolocation.watchPosition(onPos, onErr, {
          enableHighAccuracy: true,
          maximumAge: 5_000,
          timeout: 15_000,
        });
        set({ watchId });
      },

      stopWatching: () => {
        const id = get().watchId;
        if (id !== null && typeof navigator !== 'undefined') {
          navigator.geolocation.clearWatch(id);
        }
        set({ watchId: null, status: 'idle' });
      },

      refreshGeofence: (center, radius) => {
        const cur = get().current;
        if (!cur || !center) {
          set({ distanceToWorkplace: null, insideGeofence: false });
          return;
        }
        const { distance, inside } = checkGeofence(cur, center, radius);
        set({ distanceToWorkplace: distance, insideGeofence: inside });
      },

      reset: () => set({ ...initial }),
    }),
    {
      name: 'basma-location',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        current: s.current,
        distanceToWorkplace: s.distanceToWorkplace,
        insideGeofence: s.insideGeofence,
      }),
    },
  ),
);
