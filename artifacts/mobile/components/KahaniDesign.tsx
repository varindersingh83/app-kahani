import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import tokens from "@/constants/colors";
import { useKahaniTheme } from "@/context/ThemeContext";

export function serifFamily() {
  return Platform.select({
    ios: "Georgia",
    android: "serif",
    web: "Georgia, serif",
    default: "serif",
  });
}

export function cardShadow(color: string): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 5,
  };
}

export function KahaniScreen({
  children,
  scroll = true,
  withLeaves = true,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  withLeaves?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useKahaniTheme();
  const insets = useSafeAreaInsets();
  const Container = scroll ? ScrollView : View;

  return (
    <View style={[styles.screenRoot, { backgroundColor: colors.background }]}>
      {withLeaves && (
        <>
          <LeafSprig style={styles.topLeaf} />
          <LeafSprig style={styles.bottomLeaf} flip />
        </>
      )}
      <Container
        style={styles.screenRoot}
        {...(scroll
          ? {
              contentContainerStyle: [
                styles.screenContent,
                {
                  paddingTop: Math.max(insets.top + 24, tokens.spacing.screenTop),
                  paddingBottom: insets.bottom + tokens.spacing.screenBottom,
                },
                contentStyle,
              ],
              keyboardShouldPersistTaps: "handled" as const,
              showsVerticalScrollIndicator: false,
            }
          : {
              style: [
                styles.screenRoot,
                {
                  paddingTop: Math.max(insets.top + 24, tokens.spacing.screenTop),
                  paddingBottom: insets.bottom + tokens.spacing.screenBottom,
                },
                contentStyle,
              ],
            })}
      >
        {children}
      </Container>
    </View>
  );
}

export function KahaniHeader({
  title,
  subtitle,
  greeting,
  back = false,
}: {
  title: string;
  subtitle?: string;
  greeting?: string;
  back?: boolean;
}) {
  const { colors } = useKahaniTheme();

  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerTop}>
        {back ? (
          <IconButton icon="chevron-left" onPress={() => router.back()} />
        ) : (
          <View />
        )}
        <ThemeToggle />
      </View>
      {greeting ? (
        <Text style={[styles.greeting, { color: colors.foreground }]}>
          {greeting}
        </Text>
      ) : null}
      <Text style={[styles.displayTitle, { color: colors.foreground }]}>
        {title} <LeafMark />
      </Text>
      {subtitle ? (
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function ThemeToggle() {
  const { colors, scheme, toggleScheme } = useKahaniTheme();
  const isDark = scheme === "dark";

  return (
    <Pressable
      onPress={toggleScheme}
      style={[
        styles.themeTrack,
        {
          backgroundColor: colors.secondary,
          borderColor: colors.border,
        },
      ]}
      accessibilityLabel="Toggle theme"
    >
      <View
        style={[
          styles.themeThumb,
          !isDark ? styles.themeThumbLeft : styles.themeThumbRight,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(colors.shadow),
        ]}
      >
        <Feather
          name={isDark ? "moon" : "sun"}
          color={isDark ? colors.gold : colors.gold}
          size={22}
        />
      </View>
      <Feather name="sun" color={colors.goldMuted} size={18} />
      <Feather name="moon" color={colors.bark} size={18} />
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  variant = "light",
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  variant?: "light" | "primary";
}) {
  const { colors } = useKahaniTheme();
  const primary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: primary ? colors.primary : colors.card,
          borderColor: primary ? colors.primary : colors.border,
          opacity: pressed ? 0.76 : 1,
        },
        cardShadow(colors.shadow),
      ]}
    >
      <Feather
        name={icon}
        color={primary ? colors.primaryForeground : colors.bark}
        size={24}
      />
    </Pressable>
  );
}

export function KahaniButton({
  label,
  icon = "zap",
  onPress,
  disabled,
  style,
}: {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useKahaniTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: disabled ? colors.secondary : colors.primary,
          opacity: pressed ? 0.82 : 1,
        },
        cardShadow(colors.shadow),
        style,
      ]}
    >
      <Feather
        name={icon}
        color={disabled ? colors.mutedForeground : colors.primaryForeground}
        size={20}
      />
      <Text
        style={[
          styles.primaryButtonText,
          {
            color: disabled ? colors.mutedForeground : colors.primaryForeground,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  const { colors } = useKahaniTheme();

  return (
    <View style={styles.segmentRow}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              {
                backgroundColor: selected ? colors.primary : colors.secondary,
                borderColor: selected ? colors.gold : colors.border,
              },
              selected && cardShadow(colors.glow),
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color: selected
                    ? colors.primaryForeground
                    : colors.secondaryForeground,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function OptionPill({
  label,
  selected,
  onPress,
  children,
}: {
  label?: string;
  selected?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const { colors } = useKahaniTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionPill,
        {
          backgroundColor: selected ? colors.primary : colors.secondary,
          borderColor: selected ? colors.gold : colors.border,
        },
      ]}
    >
      {children ?? (
        <Text
          style={[
            styles.optionText,
            { color: selected ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function CharacterAvatar({
  label,
  imageUri,
  selected,
  onPress,
  icon = "user",
}: {
  label: string;
  imageUri?: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const { colors } = useKahaniTheme();
  const initial = label.trim()[0]?.toUpperCase();

  return (
    <Pressable onPress={onPress} style={styles.avatarSlot}>
      <View
        style={[
          styles.avatarBox,
          {
            backgroundColor: colors.secondary,
            borderColor: selected ? colors.primary : colors.border,
            borderWidth: selected ? 2 : 1,
          },
          selected && cardShadow(colors.glow),
        ]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.fill} />
        ) : initial ? (
          <Text style={[styles.avatarInitial, { color: colors.bark }]}>
            {initial}
          </Text>
        ) : (
          <Feather name={icon} color={colors.bark} size={30} />
        )}
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.avatarLabel,
          { color: selected ? colors.primary : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function BookCoverCard({
  imageUri,
  title,
  badge,
  style,
}: {
  imageUri?: string;
  title?: string;
  badge?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useKahaniTheme();

  return (
    <View
      style={[
        styles.coverCard,
        { backgroundColor: colors.secondary, borderColor: colors.border },
        style,
      ]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.fill} resizeMode="cover" />
      ) : (
        <PlaceholderArt title={title} />
      )}
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>
            {badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function StoryCard({
  title,
  description,
  imageUri,
  pages,
  onPress,
  featured = false,
}: {
  title: string;
  description?: string;
  imageUri?: string;
  pages?: number;
  onPress?: () => void;
  featured?: boolean;
}) {
  const { colors } = useKahaniTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        featured ? styles.storyFeatured : styles.storyGrid,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.86 : 1,
        },
        cardShadow(colors.shadow),
      ]}
    >
      <BookCoverCard
        imageUri={imageUri}
        title={title}
        badge={featured ? "New" : undefined}
        style={featured ? styles.featuredImage : styles.gridImage}
      />
      <View style={featured ? styles.featuredBody : styles.gridBody}>
        {featured ? (
          <Text style={[styles.overline, { color: colors.gold }]}>
            Just created
          </Text>
        ) : null}
        <Text
          numberOfLines={featured ? 3 : 2}
          style={[
            featured ? styles.featuredTitle : styles.gridTitle,
            { color: colors.foreground },
          ]}
        >
          {title}
        </Text>
        {description ? (
          <Text
            numberOfLines={featured ? 4 : 1}
            style={[styles.storyDescription, { color: colors.mutedForeground }]}
          >
            {description}
          </Text>
        ) : null}
        {pages ? (
          <Text style={[styles.storyMeta, { color: colors.mutedForeground }]}>
            {pages} pages
          </Text>
        ) : null}
      </View>
      {featured ? (
        <View style={[styles.cardArrow, { backgroundColor: colors.primary }]}>
          <Feather name="chevron-right" color={colors.primaryForeground} size={26} />
        </View>
      ) : (
        <View style={[styles.moreButton, { backgroundColor: colors.card }]}>
          <Feather name="more-horizontal" color={colors.bark} size={20} />
        </View>
      )}
    </Pressable>
  );
}

export function ProgressDots({
  count,
  index,
}: {
  count: number;
  index: number;
}) {
  const { colors } = useKahaniTheme();

  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, dotIndex) => (
        <View
          key={dotIndex}
          style={[
            styles.dot,
            {
              width: dotIndex === index ? 20 : 7,
              backgroundColor:
                dotIndex === index ? colors.primary : colors.secondary,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function ReaderNavButton({
  direction,
  onPress,
  disabled,
}: {
  direction: "left" | "right";
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <IconButton
      icon={direction === "left" ? "arrow-left" : "arrow-right"}
      onPress={disabled ? undefined : onPress}
      variant={direction === "right" ? "primary" : "light"}
    />
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const { colors } = useKahaniTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
      {children}
    </Text>
  );
}

export function LeafMark() {
  const { colors } = useKahaniTheme();
  return <Text style={{ color: colors.leaf }}> 🌿</Text>;
}

export function LeafSprig({
  style,
  flip,
}: {
  style?: StyleProp<ViewStyle>;
  flip?: boolean;
}) {
  const { colors } = useKahaniTheme();
  return (
    <View
      pointerEvents="none"
      style={[
        styles.leafSprig,
        flip && { transform: [{ scaleX: -1 }, { rotate: "-18deg" }] },
        style,
      ]}
    >
      <View style={[styles.stem, { backgroundColor: colors.leafMuted }]} />
      {[0, 1, 2, 3, 4].map((leaf) => (
        <View
          key={leaf}
          style={[
            styles.leaf,
            {
              backgroundColor: leaf % 2 ? colors.leaf : colors.leafMuted,
              top: leaf * 16,
              left: leaf % 2 ? 25 : 0,
              transform: [{ rotate: leaf % 2 ? "-28deg" : "28deg" }],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function PlaceholderArt({ title }: { title?: string }) {
  const { colors, scheme } = useKahaniTheme();
  const night = scheme === "dark";
  return (
    <LinearGradient
      colors={
        night
          ? ["#07111F", "#12253B", "#2D3C28"]
          : ["#F8E4B8", "#F7E7C4", "#87954F"]
      }
      style={styles.placeholderArt}
    >
      <View style={[styles.sunDisc, { backgroundColor: night ? "#F4DEBA" : "#FFF4CB" }]} />
      <View style={[styles.tree, { left: 12, backgroundColor: colors.bark }]} />
      <View style={[styles.tree, { right: 16, backgroundColor: colors.bark }]} />
      <View style={[styles.childHead, { backgroundColor: "#D9A06A" }]} />
      <View style={[styles.childBody, { backgroundColor: colors.leaf }]} />
      <View style={[styles.seedling, { backgroundColor: colors.leaf }]} />
      <Text numberOfLines={2} style={styles.artTitle}>
        {title ?? "Kahani"}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  screenContent: {
    paddingHorizontal: tokens.spacing.screenX,
  },
  headerWrap: {
    marginBottom: 26,
  },
  headerTop: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  greeting: {
    fontFamily: serifFamily(),
    fontSize: 28,
    lineHeight: 34,
  },
  displayTitle: {
    fontFamily: serifFamily(),
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: 0,
  },
  headerSubtitle: {
    fontFamily: tokens.typography.sansMedium,
    fontSize: 20,
    lineHeight: 28,
    marginTop: 6,
  },
  themeTrack: {
    position: "relative",
    width: 126,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  themeThumb: {
    position: "absolute",
    top: -1,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  themeThumbLeft: {
    left: -1,
  },
  themeThumbRight: {
    right: -1,
  },
  iconButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    minHeight: 64,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 19,
  },
  segmentRow: {
    flexDirection: "row",
    gap: 12,
  },
  segment: {
    flex: 1,
    minHeight: 58,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  segmentText: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 16,
    textAlign: "center",
  },
  optionPill: {
    minHeight: 46,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  optionText: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 16,
  },
  avatarSlot: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarInitial: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 34,
  },
  avatarLabel: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 13,
    textAlign: "center",
  },
  fill: {
    width: "100%",
    height: "100%",
  },
  coverCard: {
    overflow: "hidden",
    borderWidth: 1,
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 13,
  },
  storyFeatured: {
    position: "relative",
    borderWidth: 1,
    borderRadius: 28,
    flexDirection: "row",
    padding: 14,
    gap: 16,
    overflow: "hidden",
  },
  storyGrid: {
    position: "relative",
    borderWidth: 1,
    borderRadius: 22,
    overflow: "hidden",
  },
  featuredImage: {
    width: 150,
    height: 150,
    borderRadius: 20,
  },
  gridImage: {
    width: "100%",
    height: 150,
    borderRadius: 0,
    borderWidth: 0,
  },
  featuredBody: {
    flex: 1,
    paddingVertical: 8,
    paddingRight: 18,
  },
  gridBody: {
    padding: 14,
    minHeight: 126,
  },
  overline: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 12,
    marginBottom: 8,
  },
  featuredTitle: {
    fontFamily: serifFamily(),
    fontSize: 31,
    lineHeight: 38,
  },
  gridTitle: {
    fontFamily: serifFamily(),
    fontSize: 24,
    lineHeight: 29,
  },
  storyDescription: {
    fontFamily: tokens.typography.sansMedium,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
  },
  storyMeta: {
    fontFamily: tokens.typography.sansMedium,
    fontSize: 13,
    marginTop: 10,
  },
  cardArrow: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  moreButton: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    height: 7,
    borderRadius: 999,
  },
  sectionTitle: {
    fontFamily: serifFamily(),
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 16,
  },
  leafSprig: {
    position: "absolute",
    width: 86,
    height: 120,
    zIndex: 0,
    opacity: 0.86,
    transform: [{ rotate: "18deg" }],
  },
  topLeaf: {
    top: 98,
    right: -20,
  },
  bottomLeaf: {
    bottom: 112,
    left: -28,
  },
  stem: {
    position: "absolute",
    left: 38,
    top: 4,
    width: 4,
    height: 96,
    borderRadius: 2,
    transform: [{ rotate: "20deg" }],
  },
  leaf: {
    position: "absolute",
    width: 34,
    height: 18,
    borderRadius: 18,
  },
  placeholderArt: {
    flex: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  sunDisc: {
    position: "absolute",
    top: 24,
    right: 28,
    width: 34,
    height: 34,
    borderRadius: 17,
    opacity: 0.8,
  },
  tree: {
    position: "absolute",
    top: 0,
    width: 18,
    height: "84%",
    borderRadius: 16,
    opacity: 0.42,
  },
  childHead: {
    position: "absolute",
    bottom: 58,
    left: "34%",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  childBody: {
    position: "absolute",
    bottom: 20,
    left: "31%",
    width: 48,
    height: 48,
    borderRadius: 18,
  },
  seedling: {
    position: "absolute",
    right: "30%",
    bottom: 42,
    width: 24,
    height: 54,
    borderRadius: 18,
  },
  artTitle: {
    position: "absolute",
    bottom: 12,
    right: 12,
    left: 12,
    color: "rgba(255,255,255,0.82)",
    fontFamily: serifFamily(),
    fontSize: 16,
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.32)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
});
