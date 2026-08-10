import '../global.css';
import { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { getDatabase } from '@/core/database/sqlite-client';
import { queryClient } from '@/core/query/query-client';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        await getDatabase();
        if (isMounted) {
          setIsReady(true);
        }
      } catch (error) {
        if (isMounted) {
          setInitError(error instanceof Error ? error.message : 'Failed to initialize the app.');
        }
      } finally {
        await SplashScreen.hideAsync().catch(() => undefined);
      }
    }

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [isReady]);

  if (initError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 px-6">
        <Text className="text-center text-base font-semibold text-red-400">
          NutriAI failed to start: {initError}
        </Text>
      </View>
    );
  }

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1" onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
