/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: "#30281F",
    tint: "#8B6F47",
    background: "#F8F1E7",
    foreground: "#30281F",
    card: "#FFF9EF",
    cardForeground: "#30281F",
    primary: "#8B6F47",
    primaryForeground: "#FFF9EF",
    secondary: "#E8DDC9",
    secondaryForeground: "#3B3328",
    muted: "#EFE5D4",
    mutedForeground: "#796B59",
    accent: "#DDE8D4",
    accentForeground: "#2F3B2D",
    destructive: "#B65C45",
    destructiveForeground: "#FFF9EF",
    border: "#DDCDB7",
    input: "#DDCDB7",
  },
  radius: 18,
};

export default colors;
