import { create } from 'zustand';
import { Driver, DeliverySession, Stop } from '@/types';

interface AppState {
  // Auth
  driver: Driver | null;
  setDriver: (driver: Driver | null) => void;

  // Current session
  session: DeliverySession | null;
  setSession: (session: DeliverySession | null) => void;
  updateSessionStops: (stops: Stop[]) => void;
  updateStop: (stopId: string, updates: Partial<Stop>) => void;

  // Active delivery
  activeStopIndex: number;
  setActiveStopIndex: (index: number) => void;

  // Location
  currentLocation: { lat: number; lng: number } | null;
  setCurrentLocation: (loc: { lat: number; lng: number } | null) => void;
}

export const useStore = create<AppState>((set) => ({
  driver: null,
  setDriver: (driver) => set({ driver }),

  session: null,
  setSession: (session) => set({ session }),
  updateSessionStops: (stops) =>
    set((state) => ({
      session: state.session ? { ...state.session, stops } : null,
    })),
  updateStop: (stopId, updates) =>
    set((state) => ({
      session: state.session
        ? {
            ...state.session,
            stops: state.session.stops.map((s) =>
              s.id === stopId ? { ...s, ...updates } : s
            ),
          }
        : null,
    })),

  activeStopIndex: 0,
  setActiveStopIndex: (index) => set({ activeStopIndex: index }),

  currentLocation: null,
  setCurrentLocation: (currentLocation) => set({ currentLocation }),
}));
