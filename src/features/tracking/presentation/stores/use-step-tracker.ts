// src/features/tracking/presentation/stores/use-step-tracker.ts
import { create } from 'zustand';
import { pedometerDataSource } from '../../data/datasources/pedometer-datasource';
import { estimateCaloriesBurned, estimateDistanceMeters } from '../../domain/entities/step-log';

interface StepTrackerState {
  isTracking: boolean;
  isAvailable: boolean;
  todaySteps: number;
  liveSessionSteps: number;
  distanceMeters: number;
  caloriesBurned: number;
  error: string | null;
  unsubscribe: (() => void) | null;
  initialize: () => Promise<void>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

export const useStepTracker = create<StepTrackerState>((set, get) => ({
  isTracking: false,
  isAvailable: false,
  todaySteps: 0,
  liveSessionSteps: 0,
  distanceMeters: 0,
  caloriesBurned: 0,
  error: null,
  unsubscribe: null,

  initialize: async () => {
    const available = await pedometerDataSource.isAvailable();
    set({ isAvailable: available });
    if (!available) {
      set({ error: 'Pedometer is not available on this device.' });
      return;
    }

    const permission = await pedometerDataSource.requestPermission();
    if (!permission.ok) {
      set({ error: permission.error.message });
      return;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const historyResult = await pedometerDataSource.getStepsBetween(startOfDay, new Date());
    if (historyResult.ok) {
      const steps = historyResult.value;
      set({
        todaySteps: steps,
        distanceMeters: estimateDistanceMeters(steps),
        caloriesBurned: estimateCaloriesBurned(steps),
      });
    }
  },

  startTracking: async () => {
    if (get().isTracking) return;

    const unsubscribe = pedometerDataSource.subscribeToLiveSteps((steps) => {
      const total = get().todaySteps + steps;
      set({
        liveSessionSteps: steps,
        distanceMeters: estimateDistanceMeters(total),
        caloriesBurned: estimateCaloriesBurned(total),
      });
    });

    set({ isTracking: true, unsubscribe, error: null });
  },

  stopTracking: () => {
    get().unsubscribe?.();
    set({ isTracking: false, unsubscribe: null });
  },
}));