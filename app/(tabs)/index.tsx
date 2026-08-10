// app/(tabs)/index.tsx
import { useEffect } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNutritionStore } from '@/features/nutrition/presentation/stores/use-nutrition-store';
import { useDailySummary } from '@/features/nutrition/presentation/hooks/use-daily-summary';
import { CalorieRing } from '@/features/nutrition/presentation/components/calorie-ring';
import { MacroDistributionChart } from '@/features/nutrition/presentation/components/macro-distribution-chart';
import { useStepTracker } from '@/features/tracking/presentation/stores/use-step-tracker';

export default function DashboardScreen() {
  const selectedDate = useNutritionStore((state) => state.selectedDate);
  const dailyCalorieGoal = useNutritionStore((state) => state.dailyCalorieGoal);
  const proteinGoalGrams = useNutritionStore((state) => state.proteinGoalGrams);
  const carbsGoalGrams = useNutritionStore((state) => state.carbsGoalGrams);
  const fatGoalGrams = useNutritionStore((state) => state.fatGoalGrams);

  const { data: summary, isLoading, isRefetching, refetch } = useDailySummary(selectedDate);

  const initializeSteps = useStepTracker((state) => state.initialize);
  const startTracking = useStepTracker((state) => state.startTracking);
  const stopTracking = useStepTracker((state) => state.stopTracking);
  const todaySteps = useStepTracker((state) => state.todaySteps);
  const liveSessionSteps = useStepTracker((state) => state.liveSessionSteps);
  const caloriesBurned = useStepTracker((state) => state.caloriesBurned);
  const stepError = useStepTracker((state) => state.error);

  useEffect(() => {
    initializeSteps().then(() => startTracking());
    return () => stopTracking();
  }, [initializeSteps, startTracking, stopTracking]);

  const consumedCalories = summary?.totalCalories ?? 0;
  const totalSteps = todaySteps + liveSessionSteps;

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <ScrollView
        className="flex-1 px-5"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#22C55E" />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="mb-2 mt-4">
          <Text className="text-sm font-medium text-slate-400">Today</Text>
          <Text className="text-2xl font-bold text-white">Your Nutrition</Text>
        </View>

        <View className="my-6 items-center">
          <CalorieRing consumed={consumedCalories} goal={dailyCalorieGoal} />
          {isLoading && <Text className="mt-2 text-xs text-slate-500">Loading today's log…</Text>}
        </View>

        <View className="mb-6 flex-row justify-between rounded-2xl bg-slate-900 p-4">
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-white">{totalSteps.toLocaleString()}</Text>
            <Text className="text-xs text-slate-400">Steps</Text>
          </View>
          <View className="flex-1 items-center border-x border-slate-800">
            <Text className="text-xl font-bold text-white">{caloriesBurned}</Text>
            <Text className="text-xs text-slate-400">Kcal burned</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-white">{summary?.items.length ?? 0}</Text>
            <Text className="text-xs text-slate-400">Logs today</Text>
          </View>
        </View>

        {stepError && <Text className="mb-4 text-xs text-amber-400">{stepError}</Text>}

        <Text className="mb-3 text-base font-semibold text-white">Macros</Text>
        <MacroDistributionChart
          macros={summary?.macros ?? { proteinGrams: 0, carbsGrams: 0, fatGrams: 0 }}
          goals={{
            proteinGrams: proteinGoalGrams,
            carbsGrams: carbsGoalGrams,
            fatGrams: fatGoalGrams,
          }}
        />

        <Text className="mb-3 mt-6 text-base font-semibold text-white">Recent Logs</Text>
        {summary && summary.items.length > 0 ? (
          summary.items.map((item: any) => (
            <View
              key={item.id}
              className="mb-2 flex-row items-center justify-between rounded-xl bg-slate-900 px-4 py-3"
            >
              <View className="flex-1 pr-3">
                <Text className="text-sm font-semibold text-white">{item.name}</Text>
                <Text className="text-xs text-slate-400">
                  {item.servingSize} • {item.mealType}
                </Text>
              </View>
              <Text className="text-sm font-bold text-emerald-400">
                {Math.round(item.calories)} kcal
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-sm text-slate-500">
            No food logged yet today. Use the Scan tab to add one.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}