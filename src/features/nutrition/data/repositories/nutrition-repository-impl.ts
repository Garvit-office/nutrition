import NetInfo from '@react-native-community/netinfo';
import { randomUUID } from 'expo-crypto';
import { Result, ok, err, fromPromise } from '@/core/utils/result';
import { AppFailure, CacheFailure, NetworkFailure, ServerFailure } from '@/core/error/failures';
import { DailyNutritionSummary, FoodItem, summarizeDay } from '../../domain/entities/food-item';
import { LogFoodInput, NutritionRepository } from '../../domain/repositories/nutrition-repository';
import { nutritionLocalDataSource, NutritionLocalDataSource } from '../datasources/nutrition-local-datasource';
import { nutritionRemoteDataSource, NutritionRemoteDataSource } from '../datasources/nutrition-remote-datasource';

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export class NutritionRepositoryImpl implements NutritionRepository {
  constructor(
    private readonly local: NutritionLocalDataSource = nutritionLocalDataSource,
    private readonly remote: NutritionRemoteDataSource = nutritionRemoteDataSource,
  ) {}

  async getDailySummary(date: string): Promise<Result<DailyNutritionSummary, AppFailure>> {
    return fromPromise(
      this.local.getLogsForDate(date).then((items: FoodItem[]) => summarizeDay(date, items)),
      (error: unknown) => new CacheFailure('Unable to load nutrition logs from local storage.', error),
    );
  }

  async logFood(input: LogFoodInput): Promise<Result<FoodItem, AppFailure>> {
    const id = randomUUID();
    const localResult = await fromPromise(
      this.local.insertLog({ ...input, id }),
      (error: unknown) => new CacheFailure('Failed to save food log locally.', error),
    );
    if (!localResult.ok) return localResult;

    const online = await isOnline();
    if (online) {
      const syncResult = await fromPromise(
        this.remote.pushLog(id, input),
        (error: unknown) => new ServerFailure('Failed to sync food log to the server.', error),
      );
      if (syncResult.ok) {
        await this.local.markSynced(id);
        return ok({ ...syncResult.value, id });
      }
      await this.local.markFailed(id);
    }
    return ok(localResult.value);
  }

  async deleteFoodLog(id: string): Promise<Result<void, AppFailure>> {
    const localResult = await fromPromise(
      this.local.deleteLog(id),
      (error: unknown) => new CacheFailure('Failed to delete the local food log.', error),
    );
    if (!localResult.ok) return localResult;

    const online = await isOnline();
    if (online) {
      await fromPromise(
        this.remote.deleteLog(id),
        (error: unknown) => new ServerFailure('Failed to delete food log on the server.', error),
      );
    }
    return ok(undefined);
  }

  async searchFoodCatalog(query: string): Promise<Result<readonly FoodItem[], AppFailure>> {
    const online = await isOnline();
    if (!online) {
      return fromPromise(
        this.local.searchCache(query),
        (error: unknown) => new NetworkFailure('Offline: showing cached results only.', error),
      );
    }
    const remoteResult = await fromPromise(
      this.remote.searchCatalog(query),
      (error: unknown) => new ServerFailure('Failed to search the food catalog.', error),
    );
    if (remoteResult.ok) return remoteResult;
    return fromPromise(
      this.local.searchCache(query),
      (error: unknown) => new CacheFailure('Failed to search cached food logs.', error),
    );
  }

  async syncPendingLogs(): Promise<Result<number, AppFailure>> {
    const online = await isOnline();
    if (!online) return err(new NetworkFailure('Cannot sync while offline.'));
    const pending = await this.local.getPendingLogs();
    let syncedCount = 0;
    for (const item of pending) {
      const pushResult = await fromPromise(
        this.remote.pushLog(item.id, {
          name: item.name,
          brand: item.brand,
          calories: item.calories,
          macros: item.macros,
          servingSize: item.servingSize,
          mealType: item.mealType,
          loggedAt: item.loggedAt,
          imageUri: item.imageUri,
          source: item.source,
        }),
        (error: unknown) => new ServerFailure('Failed to sync log.', error),
      );
      if (pushResult.ok) {
        await this.local.markSynced(item.id);
        syncedCount += 1;
      } else {
        await this.local.markFailed(item.id);
      }
    }
    return ok(syncedCount);
  }
}

export const nutritionRepository = new NutritionRepositoryImpl();