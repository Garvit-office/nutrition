import { FoodItem } from '../../domain/entities/food-item';
import { LogFoodInput } from '../../domain/repositories/nutrition-repository';

export class NutritionRemoteDataSource {
  async pushLog(id: string, input: LogFoodInput): Promise<FoodItem> { return { ...input, id, synced: true }; }
  async deleteLog(id: string): Promise<void> {}
  async searchCatalog(query: string): Promise<FoodItem[]> { return []; }
}

export const nutritionRemoteDataSource = new NutritionRemoteDataSource();