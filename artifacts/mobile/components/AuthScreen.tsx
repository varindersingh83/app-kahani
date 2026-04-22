import { useSSO } from "@clerk/expo";
import { Feather, FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";

export function AuthScreen() {
  const colors = useColors();
  const { startSSOFlow } = useSSO();
  const [loadingProvider, setLoadingProvider] = useState<ProviderStrategy | null>(null);

  const showError = (error: unknown) => {
    const message =
      error && typeof error === "object" && "errors" in error
        ? String((error as { errors?: Array<{ message?: string }> }).errors?.[0]?.message)
        : "Please try another sign-in option or try again in a moment.";
    Alert.alert("Could not continue", message);
  };

  const continueWithProvider = async (provider: ProviderStrategy) => {
    setLoadingProvider(provider);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: provider,
      });
      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      showError(error);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <View style={styles.authRoot}>
      <StuffedToyBackground />
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.authScroll}>
        <View style={styles.logoBlock}>
          <View style={styles.logoWatercolor}>
            <View style={[styles.paintBlob, styles.paintBlobSage]} />
            <View style={[styles.paintBlob, styles.paintBlobPeach]} />
            <View style={[styles.paintBlob, styles.paintBlobSky]} />
            <View style={styles.logoBook}>
              <View style={styles.bookPageLeft} />
              <View style={styles.bookPageRight} />
              <Feather name="book-open" color="#7B6A42" size={34} />
              <View style={styles.logoSparkle}>
                <Feather name="star" color="#D79B66" size={14} />
              </View>
            </View>
          </View>
        </View>
        <Text style={[styles.authTitle, { color: colors.foreground }]}>
          Kahani
        </Text>
        <Text style={[styles.authSubtitle, { color: colors.mutedForeground }]}>
          Stop the Power Struggles. Start the Stories.
        </Text>

        <View style={styles.form}>
          <SocialButton
            colors={colors}
            icon="google"
            label="Continue with Google"
            tone="blush"
            loading={loadingProvider === "oauth_google"}
            disabled={loadingProvider !== null}
            onPress={() => continueWithProvider("oauth_google")}
          />
          <SocialButton
            colors={colors}
            icon="facebook"
            label="Continue with Facebook"
            tone="sky"
            loading={loadingProvider === "oauth_facebook"}
            disabled={loadingProvider !== null}
            onPress={() => continueWithProvider("oauth_facebook")}
          />
          <SocialButton
            colors={colors}
            icon="apple"
            label="Continue with Apple"
            tone="sage"
            loading={loadingProvider === "oauth_apple"}
            disabled={loadingProvider !== null}
            onPress={() => continueWithProvider("oauth_apple")}
          />
        </View>
        <Text style={[styles.authFootnote, { color: colors.mutedForeground }]}>
          Your account is handled securely by the provider you choose.
        </Text>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function StuffedToyBackground() {
  return (
    <View style={styles.stuffedBackground}>
      <View style={[styles.plushPatch, styles.plushPatchTop]} />
      <View style={[styles.plushPatch, styles.plushPatchMiddle]} />
      <View style={[styles.plushPatch, styles.plushPatchBottom]} />
      {plushFibers.map((fiber, index) => (
        <View
          key={`${fiber.left}-${fiber.top}-${index}`}
          style={[
            styles.plushFiber,
            {
              left: `${fiber.left}%`,
              top: `${fiber.top}%`,
              width: fiber.width,
              opacity: fiber.opacity,
              transform: [{ rotate: `${fiber.rotate}deg` }],
            },
          ]}
        />
      ))}
    </View>
  );
}

type ProviderStrategy = "oauth_google" | "oauth_facebook" | "oauth_apple";

function SocialButton({
  colors,
  icon,
  label,
  tone,
  loading,
  disabled,
  onPress,
}: {
  colors: ReturnType<typeof useColors>;
  icon: "google" | "facebook" | "apple";
  label: string;
  tone: "blush" | "sky" | "sage";
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const watercolor = watercolorButtons[tone];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.socialButton,
        {
          borderColor: watercolor.border,
          backgroundColor: watercolor.background,
          opacity: pressed || disabled ? 0.75 : 1,
        },
      ]}
    >
      <View style={[styles.buttonWash, { backgroundColor: watercolor.wash }]} />
      {loading ? (
        <ActivityIndicator color={colors.foreground} />
      ) : (
        <>
          <FontAwesome name={icon} color={watercolor.icon} size={20} />
          <Text style={[styles.socialButtonText, { color: colors.foreground }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  authRoot: {
    flex: 1,
    backgroundColor: "#FFFCF6",
  },
  stuffedBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFCF6",
    overflow: "hidden",
    pointerEvents: "none",
  },
  plushPatch: {
    position: "absolute",
    backgroundColor: "rgba(244, 239, 229, 0.62)",
    borderRadius: 999,
  },
  plushPatchTop: {
    width: 260,
    height: 190,
    top: -44,
    left: -64,
    transform: [{ rotate: "-14deg" }],
  },
  plushPatchMiddle: {
    width: 310,
    height: 220,
    top: 250,
    right: -118,
    backgroundColor: "rgba(250, 245, 235, 0.82)",
    transform: [{ rotate: "18deg" }],
  },
  plushPatchBottom: {
    width: 340,
    height: 230,
    bottom: -72,
    left: -94,
    backgroundColor: "rgba(243, 237, 226, 0.54)",
    transform: [{ rotate: "9deg" }],
  },
  plushFiber: {
    position: "absolute",
    height: 1,
    borderRadius: 2,
    backgroundColor: "#E5DED1",
  },
  authScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 28,
    paddingTop: Platform.OS === "web" ? 84 : 28,
  },
  logoBlock: {
    alignItems: "center",
    marginBottom: 26,
  },
  logoWatercolor: {
    width: 128,
    height: 118,
    alignItems: "center",
    justifyContent: "center",
  },
  paintBlob: {
    position: "absolute",
    opacity: 0.72,
  },
  paintBlobSage: {
    width: 106,
    height: 82,
    borderRadius: 44,
    backgroundColor: "#BFD8C4",
    transform: [{ rotate: "-11deg" }],
    left: 4,
    top: 18,
  },
  paintBlobPeach: {
    width: 86,
    height: 74,
    borderRadius: 38,
    backgroundColor: "#F2C9B7",
    transform: [{ rotate: "13deg" }],
    right: 6,
    top: 8,
  },
  paintBlobSky: {
    width: 78,
    height: 64,
    borderRadius: 34,
    backgroundColor: "#CFE4E8",
    transform: [{ rotate: "20deg" }],
    left: 24,
    bottom: 4,
  },
  logoBook: {
    width: 86,
    height: 72,
    borderRadius: 26,
    backgroundColor: "rgba(255, 249, 238, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(139, 119, 74, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bookPageLeft: {
    position: "absolute",
    width: 38,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255, 238, 211, 0.72)",
    left: 11,
    transform: [{ rotate: "-5deg" }],
  },
  bookPageRight: {
    position: "absolute",
    width: 38,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(232, 243, 229, 0.82)",
    right: 11,
    transform: [{ rotate: "5deg" }],
  },
  logoSparkle: {
    position: "absolute",
    right: 13,
    top: 12,
  },
  authTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    letterSpacing: -1,
    marginBottom: 12,
    textAlign: "center",
  },
  authSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 36,
    textAlign: "center",
  },
  form: {
    gap: 14,
  },
  socialButton: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    overflow: "hidden",
  },
  buttonWash: {
    position: "absolute",
    width: "54%",
    height: 42,
    borderRadius: 28,
    left: 18,
    opacity: 0.42,
    transform: [{ rotate: "-4deg" }],
  },
  socialButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  authFootnote: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 22,
  },
});

const plushFibers = [
  { left: 8, top: 7, width: 24, rotate: -10, opacity: 0.34 },
  { left: 28, top: 12, width: 18, rotate: 16, opacity: 0.22 },
  { left: 68, top: 9, width: 32, rotate: -6, opacity: 0.26 },
  { left: 88, top: 18, width: 20, rotate: 12, opacity: 0.2 },
  { left: 13, top: 28, width: 30, rotate: 8, opacity: 0.24 },
  { left: 49, top: 25, width: 22, rotate: -18, opacity: 0.18 },
  { left: 77, top: 33, width: 28, rotate: 14, opacity: 0.2 },
  { left: 5, top: 44, width: 20, rotate: -13, opacity: 0.2 },
  { left: 32, top: 49, width: 34, rotate: 7, opacity: 0.18 },
  { left: 63, top: 52, width: 24, rotate: -8, opacity: 0.24 },
  { left: 90, top: 47, width: 18, rotate: 18, opacity: 0.18 },
  { left: 18, top: 65, width: 28, rotate: 13, opacity: 0.22 },
  { left: 46, top: 70, width: 20, rotate: -12, opacity: 0.2 },
  { left: 73, top: 68, width: 34, rotate: 6, opacity: 0.2 },
  { left: 10, top: 84, width: 22, rotate: -16, opacity: 0.22 },
  { left: 38, top: 89, width: 30, rotate: 11, opacity: 0.18 },
  { left: 82, top: 86, width: 26, rotate: -9, opacity: 0.2 },
];

const watercolorButtons = {
  blush: {
    background: "#FFF2EC",
    border: "#EBC8B8",
    wash: "#F7CBBE",
    icon: "#9F6B54",
  },
  sky: {
    background: "#EEF8FA",
    border: "#BFDDE5",
    wash: "#CBE8EF",
    icon: "#517A8C",
  },
  sage: {
    background: "#F0F8EF",
    border: "#C7DEC4",
    wash: "#CFE5C9",
    icon: "#62795F",
  },
};