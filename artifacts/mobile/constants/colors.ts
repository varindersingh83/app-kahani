export type KahaniPalette = {
  scheme: "light" | "dark";
  text: string;
  tint: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  elevated: string;
  primary: string;
  primaryPressed: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  gold: string;
  goldMuted: string;
  leaf: string;
  leafMuted: string;
  bark: string;
  wood: string;
  woodDark: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  shadow: string;
  glow: string;
};

const light: KahaniPalette = {
  scheme: "light",
  text: "#31281E",
  tint: "#7A8048",
  background: "#FFF9F0",
  foreground: "#31281E",
  card: "#FFFDF8",
  cardForeground: "#31281E",
  elevated: "#FFF7EA",
  primary: "#7A8048",
  primaryPressed: "#62683A",
  primaryForeground: "#FFFDF8",
  secondary: "#EFE5D5",
  secondaryForeground: "#4D3F31",
  muted: "#F4EBDC",
  mutedForeground: "#81715E",
  accent: "#F2D6AC",
  accentForeground: "#4D3F31",
  gold: "#D59B3B",
  goldMuted: "#E8C98D",
  leaf: "#6F8749",
  leafMuted: "#A6B27A",
  bark: "#8B6F47",
  wood: "#F7D8AA",
  woodDark: "#D6A764",
  destructive: "#B65C45",
  destructiveForeground: "#FFFDF8",
  border: "#E7D8C6",
  input: "#EADBCB",
  shadow: "rgba(82, 60, 36, 0.18)",
  glow: "rgba(213, 155, 59, 0.30)",
};

const dark: KahaniPalette = {
  scheme: "dark",
  text: "#F4DEBA",
  tint: "#D59B3B",
  background: "#09111D",
  foreground: "#F4DEBA",
  card: "#111A27",
  cardForeground: "#F4DEBA",
  elevated: "#172130",
  primary: "#D59B3B",
  primaryPressed: "#F0B553",
  primaryForeground: "#111A27",
  secondary: "#1D2634",
  secondaryForeground: "#F4DEBA",
  muted: "#182331",
  mutedForeground: "#BCA786",
  accent: "#2B2417",
  accentForeground: "#F4DEBA",
  gold: "#E0A843",
  goldMuted: "#9C763A",
  leaf: "#8F9C55",
  leafMuted: "#59673A",
  bark: "#C28B4F",
  wood: "#2B2118",
  woodDark: "#1A1511",
  destructive: "#E07A5F",
  destructiveForeground: "#111A27",
  border: "#334052",
  input: "#3B4656",
  shadow: "rgba(0, 0, 0, 0.36)",
  glow: "rgba(213, 155, 59, 0.42)",
};

const colors = {
  light,
  dark,
  radius: {
    sm: 14,
    md: 20,
    lg: 28,
    xl: 34,
    pill: 999,
  },
  spacing: {
    screenX: 24,
    screenTop: 64,
    screenBottom: 126,
    gap: 16,
  },
  typography: {
    sansRegular: "Inter_400Regular",
    sansMedium: "Inter_500Medium",
    sansSemiBold: "Inter_600SemiBold",
    sansBold: "Inter_700Bold",
    serif: "Georgia",
  },
};

export type KahaniTokens = typeof colors;

export default colors;
