// src/features/nutrition/presentation/hooks/use-daily-summary.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionRepository } from '../../data/repositories/nutrition-repository-impl';
import { LogFoodInput } from '../../domain/repositories/nutrition-repository';

export const nutritionKeys = {
  dailySummary: (date: string) => ['nutrition', 'daily-summary', date] as const,
};

export function useDailySummary(date: string) {
  return useQuery({
    queryKey: nutritionKeys.dailySummary(date),
    queryFn: async () => {
      const result = await nutritionRepository.getDailySummary(date);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    staleTime: 30_000,
  });
}

export function useLogFoodMutation(date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogFoodInput) => {
      const result = await nutritionRepository.logFood(input);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nutritionKeys.dailySummary(date) });
    },
  });
}