// src/core/config/env.ts
import Constants from 'expo-constants';

interface AppEnv {
  apiBaseUrl: string;
  aiVisionEndpoint: string;
  apiTimeoutMs: number;
  aiVisionTimeoutMs: number;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppEnv>;

export const env: AppEnv = {
  apiBaseUrl: extra.apiBaseUrl ?? 'https://api.nutriai.app/v1',
  aiVisionEndpoint: extra.aiVisionEndpoint ?? 'https://api.nutriai.app/v1/vision/scan',
  apiTimeoutMs: 15000,
  aiVisionTimeoutMs: 5000,
};