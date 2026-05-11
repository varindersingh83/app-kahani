import tokens from "@/constants/colors";
import { useKahaniTheme } from "@/context/ThemeContext";

export function useColors() {
  const theme = useKahaniTheme();
  return { ...theme.colors, radius: tokens.radius, spacing: tokens.spacing };
}
