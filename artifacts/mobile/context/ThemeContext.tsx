import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import colors, { type KahaniPalette } from "@/constants/colors";

type ThemeMode = "system" | "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  scheme: "light" | "dark";
  colors: KahaniPalette;
  setMode: (mode: ThemeMode) => void;
  toggleScheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("dark");

  const scheme =
    mode === "system" ? (deviceScheme === "dark" ? "dark" : "light") : mode;

  const value = useMemo(
    () => ({
      mode,
      scheme,
      colors: colors[scheme],
      setMode,
      toggleScheme: () => setMode((current) => (scheme === "dark" ? "light" : "dark")),
    }),
    [mode, scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useKahaniTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useKahaniTheme must be used inside ThemeProvider.");
  }
  return value;
}
