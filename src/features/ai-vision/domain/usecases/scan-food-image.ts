// src/features/ai-vision/domain/usecases/scan-food-image.ts
import { Result, ok, err } from '@/core/utils/result';
import { AppFailure, ServerFailure, TimeoutFailure } from '@/core/error/failures';
import { FoodItem } from '@/features/nutrition/domain/entities/food-item';
import { aiVisionDataSource, CandidateFoodItem } from '../../data/datasources/ai-vision-datasource';

const SCAN_DEADLINE_MS = 5000;

export interface ScanFoodImageInput {
  readonly imageUri: string;
  readonly mealType: FoodItem['mealType'];
}

export interface ScanFoodImageResult {
  readonly candidates: readonly CandidateFoodItem[];
  readonly processingTimeMs: number;
}

function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`AI vision scan exceeded the ${ms}ms deadline.`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function scanFoodImage(
  input: ScanFoodImageInput,
): Promise<Result<ScanFoodImageResult, AppFailure>> {
  const startedAt = Date.now();

  try {
    const candidates = await withDeadline(
      aiVisionDataSource.analyzeImage(input.imageUri, input.mealType),
      SCAN_DEADLINE_MS,
    );

    return ok({
      candidates,
      processingTimeMs: Date.now() - startedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI vision error.';

    if (message.includes('deadline')) {
      return err(new TimeoutFailure(message, error));
    }

    return err(new ServerFailure('AI vision scan failed unexpectedly.', error));
  }
}