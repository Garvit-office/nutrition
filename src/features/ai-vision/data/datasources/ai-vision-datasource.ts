// src/features/ai-vision/data/datasources/ai-vision-datasource.ts
import { File } from 'expo-file-system';
import { env } from '@/core/config/env';
import { apiClient } from '@/core/network/api-client';
import { FoodItem } from '@/features/nutrition/domain/entities/food-item';

export type CandidateFoodItem = Omit<FoodItem, 'id' | 'syncStatus' | 'createdAt' | 'updatedAt'>;

interface VisionApiCandidate {
  name: string;
  brand: string | null;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  servingSize: string;
  confidence: number;
}

interface VisionApiResponse {
  candidates: VisionApiCandidate[];
}

const USE_MOCK = env.apiBaseUrl.includes('nutriai.app');

export class AiVisionDataSource {
  async analyzeImage(imageUri: string, mealType: FoodItem['mealType']): Promise<CandidateFoodItem[]> {
    if (USE_MOCK) {
      return this.mockAnalyze(imageUri, mealType);
    }
    return this.remoteAnalyze(imageUri, mealType);
  }

  private async mockAnalyze(
    imageUri: string,
    mealType: FoodItem['mealType'],
  ): Promise<CandidateFoodItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 700));

    const now = new Date().toISOString();

    return [
      {
        name: 'Grilled Chicken Breast',
        brand: null,
        calories: 284,
        macros: { proteinGrams: 53, carbsGrams: 0, fatGrams: 6 },
        servingSize: '200g',
        mealType,
        loggedAt: now,
        imageUri,
        source: 'ai_scan',
      },
      {
        name: 'Steamed Brown Rice',
        brand: null,
        calories: 216,
        macros: { proteinGrams: 5, carbsGrams: 45, fatGrams: 2 },
        servingSize: '1 cup',
        mealType,
        loggedAt: now,
        imageUri,
        source: 'ai_scan',
      },
      {
        name: 'Steamed Broccoli',
        brand: null,
        calories: 55,
        macros: { proteinGrams: 4, carbsGrams: 11, fatGrams: 0.5 },
        servingSize: '1 cup',
        mealType,
        loggedAt: now,
        imageUri,
        source: 'ai_scan',
      },
    ];
  }

  private async remoteAnalyze(
    imageUri: string,
    mealType: FoodItem['mealType'],
  ): Promise<CandidateFoodItem[]> {
    const base64 = new File(imageUri).base64();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.aiVisionTimeoutMs);

    try {
      const response = await apiClient.post<VisionApiResponse>(
        env.aiVisionEndpoint,
        { imageBase64: base64, mealType },
        { signal: controller.signal },
      );

      const now = new Date().toISOString();
      return response.data.candidates
        .filter((candidate) => candidate.confidence >= 0.4)
        .map((candidate) => ({
          name: candidate.name,
          brand: candidate.brand,
          calories: candidate.calories,
          macros: {
            proteinGrams: candidate.proteinGrams,
            carbsGrams: candidate.carbsGrams,
            fatGrams: candidate.fatGrams,
          },
          servingSize: candidate.servingSize,
          mealType,
          loggedAt: now,
          imageUri,
          source: 'ai_scan' as const,
        }));
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const aiVisionDataSource = new AiVisionDataSource();