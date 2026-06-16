import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '@/hooks/useAuth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, driver, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync();
    const inAuth = segments[0] === 'auth';
    if (!session) {
      if (!inAuth) router.replace('/auth/login');
    } else if (!driver?.name) {
      if (segments[1] !== 'profile-setup') router.replace('/auth/profile-setup');
    } else {
      if (inAuth) router.replace('/tabs/home');
    }
  }, [session, driver, loading]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/profile-setup" />
        <Stack.Screen name="tabs" />
        <Stack.Screen name="delivery/active" options={{ presentation: 'modal' }} />
        <Stack.Screen name="delivery/stop-detail" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}