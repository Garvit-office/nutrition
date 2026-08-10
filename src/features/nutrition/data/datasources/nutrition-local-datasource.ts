import { FoodItem } from '../../domain/entities/food-item';
import { LogFoodInput } from '../../domain/repositories/nutrition-repository';

export class NutritionLocalDataSource {
  private logs: FoodItem[] = [];
  async getLogsForDate(date: string): Promise<FoodItem[]> { return this.logs.filter(l => l.loggedAt.startsWith(date)); }
  async insertLog(input: LogFoodInput & { id: string }): Promise<FoodItem> { const item: FoodItem = { ...input, synced: false }; this.logs.push(item); return item; }
  async deleteLog(id: string): Promise<void> { this.logs = this.logs.filter(l => l.id !== id); }
  async searchCache(query: string): Promise<FoodItem[]> { return this.logs.filter(l => l.name.toLowerCase().includes(query.toLowerCase())); }
  async getPendingLogs(): Promise<FoodItem[]> { return this.logs.filter(l => !l.synced); }
  async markSynced(id: string): Promise<void> { const item = this.logs.find(l => l.id === id); if (item) item.synced = true; }
  async markFailed(id: string): Promise<void> { const item = this.logs.find(l => l.id === id); if (item) item.synced = false; }
}

export const nutritionLocalDataSource = new NutritionLocalDataSource();