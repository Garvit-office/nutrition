// src/features/tracking/domain/entities/step-log.ts
export interface StepLog {
  readonly date: string;
  readonly steps: number;
  readonly distanceMeters: number;
  readonly updatedAt: string;
}

export interface LiveStepReading {
  readonly steps: number;
  readonly timestamp: number;
}

export function estimateDistanceMeters(steps: number, strideLengthMeters = 0.762): number {
  return Math.round(steps * strideLengthMeters * 100) / 100;
}

export function estimateCaloriesBurned(steps: number, bodyWeightKg = 70): number {
  const caloriesPerStep = 0.0005 * bodyWeightKg;
  return Math.round(steps * caloriesPerStep);
}