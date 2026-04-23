import {
  ClerkLoaded,
  ClerkProvider,
  useAuth,
} from "@clerk/expo";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthScreen } from "@/components/AuthScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StoryProvider } from "@/context/StoryContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const domain = process.env.EXPO_PUBLIC_DOMAIN;
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

if (apiBaseUrl) {
  setBaseUrl(apiBaseUrl);
} else if (domain) {
  setBaseUrl(`https://${domain}`);
}

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="book-reader"
        options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}

function AuthenticatedRoot() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(async () => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <AuthScreen />;
  }

  return (
    <StoryProvider>
      <RootLayoutNav />
    </StoryProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const app = publishableKey ? (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AuthenticatedRoot />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </ClerkLoaded>
    </ClerkProvider>
  ) : (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <StoryProvider>
          <RootLayoutNav />
        </StoryProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>{app}</QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
