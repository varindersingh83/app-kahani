import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthScreen } from "@/components/AuthScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorFallback } from "@/components/ErrorFallback";
import tokens from "@/constants/colors";
import { StoryProvider } from "@/context/StoryContext";
import { ThemeProvider } from "@/context/ThemeContext";
import {
  ONBOARDING_CONSENT_STORAGE_KEY,
  createAcceptedConsent,
  createDeclinedConsent,
  hasRequiredOnboardingConsent,
  parseOnboardingConsent,
  serializeOnboardingConsent,
} from "@/services/onboardingConsent";
import { getAuthRuntimeMode } from "@/services/runtimeConfig";

if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient();
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const domain = process.env.EXPO_PUBLIC_DOMAIN;
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const authRuntimeMode = getAuthRuntimeMode({
  apiBaseUrl,
  domain,
  clerkPublishableKey: publishableKey,
});

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

const InteractionRoot = ({ children }: { children: React.ReactNode }) => {
  if (Platform.OS === "web") {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  const { GestureHandlerRootView } =
    require("react-native-gesture-handler") as {
      GestureHandlerRootView: React.ComponentType<ViewProps>;
    };
  const { KeyboardProvider } = require("react-native-keyboard-controller") as {
    KeyboardProvider: React.ComponentType<{ children: React.ReactNode }>;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>{children}</KeyboardProvider>
    </GestureHandlerRootView>
  );
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="book-reader"
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

function AuthenticatedRoot() {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(async () => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <AuthScreen />;
  }

  return (
    <StoryProvider profileId={userId}>
      <RootLayoutNav />
    </StoryProvider>
  );
}

function ConsentGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<
    "accepted" | "declined" | "loading" | "unanswered"
  >("loading");

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_CONSENT_STORAGE_KEY).then((raw) => {
      const consent = parseOnboardingConsent(raw);
      setState(hasRequiredOnboardingConsent(consent) ? "accepted" : "unanswered");
    });
  }, []);

  const accept = async () => {
    await AsyncStorage.setItem(
      ONBOARDING_CONSENT_STORAGE_KEY,
      serializeOnboardingConsent(createAcceptedConsent()),
    );
    setState("accepted");
  };

  const decline = async () => {
    await AsyncStorage.setItem(
      ONBOARDING_CONSENT_STORAGE_KEY,
      serializeOnboardingConsent(createDeclinedConsent()),
    );
    setState("declined");
  };

  if (state === "loading") return null;
  if (state === "accepted") return <>{children}</>;

  return (
    <View style={styles.consentScreen}>
      <Text style={styles.consentTitle}>Kahani privacy consent</Text>
      <Text style={styles.consentText}>
        Kahani uses AI to create stories and images. Family photos stay on this
        device for local checks only, are discarded after processing, and are
        never sent to AI providers. Product analytics are metadata-only and are
        used to improve the app, not to sell data.
      </Text>
      {state === "declined" ? (
        <Text style={styles.declinedText}>
          Consent is required to use Kahani because the app depends on local
          photo processing, external AI generation, and metadata-only analytics.
        </Text>
      ) : null}
      <Pressable style={styles.primaryConsentButton} onPress={accept}>
        <Text style={styles.primaryConsentText}>I consent</Text>
      </Pressable>
      <Pressable style={styles.secondaryConsentButton} onPress={decline}>
        <Text style={styles.secondaryConsentText}>I do not consent</Text>
      </Pressable>
    </View>
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
    if (Platform.OS !== "web" && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (Platform.OS !== "web" && !fontsLoaded && !fontError) return null;

  const app =
    authRuntimeMode === "missing-clerk-for-remote-api" ? (
      <InteractionRoot>
        <ErrorFallback
          error={
            new Error(
              "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY for remote API build.",
            )
          }
          resetError={() => undefined}
        />
      </InteractionRoot>
    ) : publishableKey ? (
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ClerkLoaded>
          <InteractionRoot>
            <ConsentGate>
              <AuthenticatedRoot />
            </ConsentGate>
          </InteractionRoot>
        </ClerkLoaded>
      </ClerkProvider>
    ) : (
      <InteractionRoot>
        <ConsentGate>
          <StoryProvider>
            <RootLayoutNav />
          </StoryProvider>
        </ConsentGate>
      </InteractionRoot>
    );

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>{app}</QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  consentScreen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#f9f3e8",
    gap: 18,
  },
  consentTitle: {
    fontFamily: tokens.typography.serif,
    fontSize: 34,
    lineHeight: 40,
    color: "#342517",
  },
  consentText: {
    fontFamily: tokens.typography.sansMedium,
    fontSize: 16,
    lineHeight: 24,
    color: "#584630",
  },
  declinedText: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 14,
    lineHeight: 20,
    color: "#7a2e1f",
  },
  primaryConsentButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6d4c2f",
  },
  primaryConsentText: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 16,
    color: "#fffaf2",
  },
  secondaryConsentButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d7c4a5",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryConsentText: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 15,
    color: "#6d4c2f",
  },
});
