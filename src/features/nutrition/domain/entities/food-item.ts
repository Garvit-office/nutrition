// src/features/nutrition/domain/entities/food-item.ts
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodLogSource = 'manual' | 'ai_scan' | 'barcode';
export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface MacroBreakdown {
  readonly proteinGrams: number;
  readonly carbsGrams: number;
  readonly fatGrams: number;
}

export interface FoodItem {
  readonly id: string;
  readonly name: string;
  readonly brand: string | null;
  readonly calories: number;
  readonly macros: MacroBreakdown;
  readonly servingSize: string;
  readonly mealType: MealType;
  readonly loggedAt: string;
  readonly imageUri: string | null;
  readonly source: FoodLogSource;
  readonly syncStatus: SyncStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DailyNutritionSummary {
  readonly date: string;
  readonly totalCalories: number;
  readonly macros: MacroBreakdown;
  readonly items: readonly FoodItem[];
}

export function calculateMacroCalories(macros: MacroBreakdown): number {
  return macros.proteinGrams * 4 + macros.carbsGrams * 4 + macros.fatGrams * 9;
}

export function summarizeDay(date: string, items: readonly FoodItem[]): DailyNutritionSummary {
  const totals = items.reduce<MacroBreakdown & { calories: number }>(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      proteinGrams: acc.proteinGrams + item.macros.proteinGrams,
      carbsGrams: acc.carbsGrams + item.macros.carbsGrams,
      fatGrams: acc.fatGrams + item.macros.fatGrams,
    }),
    { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 },
  );

  return {
    date,
    totalCalories: totals.calories,
    macros: {
      proteinGrams: totals.proteinGrams,
      carbsGrams: totals.carbsGrams,
      fatGrams: totals.fatGrams,
    },
    items,
  };
}
