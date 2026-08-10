import { create } from 'zustand';
import { DailyNutritionSummary } from '../../domain/entities/food-item';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

interface NutritionUiState {
  selectedDate: string;
  dailyCalorieGoal: number;
  proteinGoalGrams: number;
  carbsGoalGrams: number;
  fatGoalGrams: number;
  activeSummary: DailyNutritionSummary | null;
  isScannerSheetOpen: boolean;
  setSelectedDate: (date: string) => void;
  setActiveSummary: (summary: DailyNutritionSummary | null) => void;
  setDailyGoals: (goals: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  }) => void;
  openScannerSheet: () => void;
  closeScannerSheet: () => void;
}

export const useNutritionStore = create<NutritionUiState>((set) => ({
  selectedDate: todayIsoDate(),
  dailyCalorieGoal: 2200,
  proteinGoalGrams: 140,
  carbsGoalGrams: 220,
  fatGoalGrams: 70,
  activeSummary: null,
  isScannerSheetOpen: false,
  setSelectedDate: (date) => set({ selectedDate: date }),
  setActiveSummary: (summary) => set({ activeSummary: summary }),
  setDailyGoals: (goals) =>
    set({
      dailyCalorieGoal: goals.calories,
      proteinGoalGrams: goals.proteinGrams,
      carbsGoalGrams: goals.carbsGrams,
      fatGoalGrams: goals.fatGrams,
    }),
  openScannerSheet: () => set({ isScannerSheetOpen: true }),
  closeScannerSheet: () => set({ isScannerSheetOpen: false }),
}));
