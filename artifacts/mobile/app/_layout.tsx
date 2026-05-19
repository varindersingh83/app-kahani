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
import { StoryProvider } from "@/context/StoryContext";
import { ThemeProvider } from "@/context/ThemeContext";
import {
  acceptOnboardingConsent,
  declineOnboardingConsent,
  getOnboardingConsent,
  type OnboardingConsentState,
} from "@/services/onboardingConsent";

if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync();
}

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

const InteractionRoot = ({ children }: { children: React.ReactNode }) => {
  if (Platform.OS === "web") {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  const { GestureHandlerRootView } = require("react-native-gesture-handler") as {
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
        options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
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

function OnboardingConsentGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [consent, setConsent] = React.useState<
    OnboardingConsentState | null | undefined
  >(undefined);

  useEffect(() => {
    let active = true;
    getOnboardingConsent().then((existing) => {
      if (active) setConsent(existing);
    });
    return () => {
      active = false;
    };
  }, []);

  if (consent === undefined) return null;
  if (consent) return <>{children}</>;

  return (
    <View style={consentStyles.screen}>
      <View style={consentStyles.panel}>
        <Text style={consentStyles.title}>Kahani consent</Text>
        <Text style={consentStyles.body}>
          Kahani uses your family inputs to create stories and collects only
          anonymous behavior metadata to improve the app. Photos are not sent to
          text AI providers.
        </Text>
        <Pressable
          style={[consentStyles.button, consentStyles.primaryButton]}
          onPress={async () => setConsent(await acceptOnboardingConsent())}
        >
          <Text style={consentStyles.primaryText}>I consent</Text>
        </Pressable>
        <Pressable
          style={[consentStyles.button, consentStyles.secondaryButton]}
          onPress={async () => {
            await declineOnboardingConsent();
            setConsent(null);
          }}
        >
          <Text style={consentStyles.secondaryText}>I do not consent</Text>
        </Pressable>
      </View>
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

  const app = publishableKey ? (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <InteractionRoot>
          <OnboardingConsentGate>
            <AuthenticatedRoot />
          </OnboardingConsentGate>
        </InteractionRoot>
      </ClerkLoaded>
    </ClerkProvider>
  ) : (
    <InteractionRoot>
      <OnboardingConsentGate>
        <StoryProvider>
          <RootLayoutNav />
        </StoryProvider>
      </OnboardingConsentGate>
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

const consentStyles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8F1E7",
  },
  panel: {
    gap: 16,
  },
  title: {
    color: "#3C2F24",
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    lineHeight: 36,
  },
  body: {
    color: "#5B4B3D",
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingHorizontal: 18,
  },
  primaryButton: {
    backgroundColor: "#7C4A28",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#CDBBA7",
  },
  primaryText: {
    color: "#FFF8ED",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  secondaryText: {
    color: "#3C2F24",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
});
