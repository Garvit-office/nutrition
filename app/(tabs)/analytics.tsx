// app/(tabs)/scan.tsx
import { useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { scanFoodImage } from '@/features/ai-vision/domain/usecases/scan-food-image';
import { CandidateFoodItem } from '@/features/ai-vision/data/datasources/ai-vision-datasource';
import { useNutritionStore } from '@/features/nutrition/presentation/stores/use-nutrition-store';
import { useLogFoodMutation } from '@/features/nutrition/presentation/hooks/use-daily-summary';

export default function ScanScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing] = useState<CameraType>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [candidates, setCandidates] = useState<CandidateFoodItem[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const selectedDate = useNutritionStore((state) => state.selectedDate);
  const logFoodMutation = useLogFoodMutation(selectedDate);

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#22C55E" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-950 px-8">
        <Ionicons name="camera-outline" size={48} color="#64748B" />
        <Text className="mt-4 text-center text-base font-semibold text-white">
          NutriAI needs camera access to scan your meals.
        </Text>
        <Pressable onPress={requestPermission} className="mt-6 rounded-full bg-emerald-500 px-6 py-3">
          <Text className="font-semibold text-slate-950">Grant Camera Access</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    setScanError(null);
    setCandidates(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: false });
      if (!photo?.uri) {
        throw new Error('Failed to capture image.');
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);

      const result = await scanFoodImage({ imageUri: photo.uri, mealType: 'lunch' });

      if (!result.ok) {
        setScanError(result.error.message);
        return;
      }

      setCandidates([...result.value.candidates]);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Unexpected scanning error.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleLogCandidate = (candidate: CandidateFoodItem) => {
    logFoodMutation.mutate(
      {
        name: candidate.name,
        brand: candidate.brand,
        calories: candidate.calories,
        macros: candidate.macros,
        servingSize: candidate.servingSize,
        mealType: candidate.mealType,
        loggedAt: candidate.loggedAt,
        imageUri: candidate.imageUri,
        source: candidate.source,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
          Alert.alert('Logged', `${candidate.name} was added to today's log.`);
          setCandidates(null);
        },
        onError: (mutationError) => {
          Alert.alert('Failed to log food', mutationError.message);
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="flex-1">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} />

        <View className="absolute bottom-8 w-full items-center">
          <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-emerald-500"
          >
            {isCapturing ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Ionicons name="scan" size={30} color="#0F172A" />
            )}
          </Pressable>
          <Text className="mt-3 text-xs font-medium text-white">
            {isCapturing ? 'Analyzing meal…' : 'Tap to scan your meal'}
          </Text>
        </View>
      </View>

      {scanError && (
        <View className="absolute bottom-32 mx-6 rounded-xl bg-red-500/90 px-4 py-3">
          <Text className="text-sm font-semibold text-white">{scanError}</Text>
        </View>
      )}

      {candidates && candidates.length > 0 && (
        <View className="absolute bottom-0 w-full rounded-t-3xl bg-slate-950 px-5 pb-8 pt-5">
          <Text className="mb-3 text-base font-bold text-white">Detected Items</Text>
          {candidates.map((candidate, index) => (
            <Pressable
              key={`${candidate.name}-${index}`}
              onPress={() => handleLogCandidate(candidate)}
              disabled={logFoodMutation.isPending}
              className="mb-2 flex-row items-center justify-between rounded-xl bg-slate-900 px-4 py-3"
            >
              <View className="flex-1 pr-3">
                <Text className="text-sm font-semibold text-white">{candidate.name}</Text>
                <Text className="text-xs text-slate-400">{candidate.servingSize}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-bold text-emerald-400">
                  {Math.round(candidate.calories)} kcal
                </Text>
                <Text className="text-xs text-slate-500">Tap to log</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}