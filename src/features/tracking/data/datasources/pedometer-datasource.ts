// src/features/tracking/data/datasources/pedometer-datasource.ts
import { Pedometer } from 'expo-sensors';
import type { Subscription } from 'expo-sensors/build/Pedometer';
import { Result, ok, err, fromPromise } from '@/core/utils/result';
import { AppFailure, PermissionFailure, ServerFailure } from '@/core/error/failures';

export type StepCountListener = (steps: number) => void;

export class PedometerDataSource {
  private subscription: Subscription | null = null;

  async isAvailable(): Promise<boolean> {
    return Pedometer.isAvailableAsync();
  }

  async requestPermission(): Promise<Result<void, AppFailure>> {
    const { status } = await Pedometer.requestPermissionsAsync();
    if (status !== 'granted') {
      return err(new PermissionFailure('Motion & fitness permission was denied.'));
    }
    return ok(undefined);
  }

  async getStepsBetween(start: Date, end: Date): Promise<Result<number, AppFailure>> {
    return fromPromise(
      Pedometer.getStepCountAsync(start, end).then((result) => result.steps),
      (error) => new ServerFailure('Unable to read step history from the device sensor.', error),
    );
  }

  subscribeToLiveSteps(listener: StepCountListener): () => void {
    this.subscription?.remove();
    this.subscription = Pedometer.watchStepCount((result) => {
      listener(result.steps);
    });

    return () => {
      this.subscription?.remove();
      this.subscription = null;
    };
  }
}

export const pedometerDataSource = new PedometerDataSource();