// src/features/nutrition/domain/repositories/nutrition-repository.ts
import { Result } from '@/core/utils/result';
import { AppFailure } from '@/core/error/failures';
import { DailyNutritionSummary, FoodItem, MealType } from '../entities/food-item';

export interface LogFoodInput {
  readonly name: string;
  readonly brand?: string | null;
  readonly calories: number;
  readonly macros: FoodItem['macros'];
  readonly servingSize: string;
  readonly mealType: MealType;
  readonly loggedAt: string;
  readonly imageUri?: string | null;
  readonly source: FoodItem['source'];
}

export interface NutritionRepository {
  getDailySummary(date: string): Promise<Result<DailyNutritionSummary, AppFailure>>;
  logFood(input: LogFoodInput): Promise<Result<FoodItem, AppFailure>>;
  deleteFoodLog(id: string): Promise<Result<void, AppFailure>>;
  searchFoodCatalog(query: string): Promise<Result<readonly FoodItem[], AppFailure>>;
  syncPendingLogs(): Promise<Result<number, AppFailure>>;
}