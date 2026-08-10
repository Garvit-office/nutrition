// src/features/nutrition/presentation/components/macro-distribution-chart.tsx
import { View, Text } from 'react-native';
import { MacroBreakdown } from '@/features/nutrition/domain/entities/food-item';

interface MacroDistributionChartProps {
  macros: MacroBreakdown;
  goals: { proteinGrams: number; carbsGrams: number; fatGrams: number };
}

interface MacroBarConfig {
  label: string;
  value: number;
  goal: number;
  color: string;
}

function MacroBar({ label, value, goal, color }: MacroBarConfig) {
  const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;

  return (
    <View className="mb-4">
      <View className="mb-1 flex-row justify-between">
        <Text className="text-sm font-semibold text-slate-200">{label}</Text>
        <Text className="text-xs text-slate-400">
          {Math.round(value)}g / {goal}g
        </Text>
      </View>
      <View className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <View
          style={{ width: `${percentage}%`, backgroundColor: color }}
          className="h-full rounded-full"
        />
      </View>
    </View>
  );
}

export function MacroDistributionChart({ macros, goals }: MacroDistributionChartProps) {
  const bars: MacroBarConfig[] = [
    { label: 'Protein', value: macros.proteinGrams, goal: goals.proteinGrams, color: '#22C55E' },
    { label: 'Carbs', value: macros.carbsGrams, goal: goals.carbsGrams, color: '#3B82F6' },
    { label: 'Fat', value: macros.fatGrams, goal: goals.fatGrams, color: '#F59E0B' },
  ];

  return (
    <View className="rounded-2xl bg-slate-900 p-4">
      {bars.map((bar) => (
        <MacroBar key={bar.label} {...bar} />
      ))}
    </View>
  );
}