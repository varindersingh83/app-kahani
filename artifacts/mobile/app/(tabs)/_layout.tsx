import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import tokens from "@/constants/colors";
import { useKahaniTheme } from "@/context/ThemeContext";

function TabIcon({
  name,
  focused,
}: {
  name: keyof typeof Feather.glyphMap;
  focused: boolean;
}) {
  const { colors } = useKahaniTheme();

  return (
    <View
      style={[
        styles.iconWrap,
        {
          backgroundColor: focused ? colors.card : "transparent",
          borderColor: focused ? colors.border : "transparent",
        },
      ]}
    >
      <Feather
        name={name}
        color={focused ? colors.primary : colors.bark}
        size={26}
      />
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useKahaniTheme();
  const insets = useSafeAreaInsets();
  const isDark = colors.scheme === "dark";
  const tabBarBottom = Math.max(insets.bottom + 10, Platform.OS === "ios" ? 18 : 12);

  return (
    <View style={[styles.tabsRoot, { backgroundColor: colors.background }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            backgroundColor: colors.background,
          },
          tabBarActiveTintColor: colors.foreground,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarLabelStyle: {
            fontFamily: tokens.typography.serif,
            fontSize: 12,
            lineHeight: 15,
            marginTop: -2,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarStyle: {
            marginHorizontal: 20,
            marginBottom: tabBarBottom,
            height: 82,
            borderTopWidth: 0,
            borderRadius: 34,
            paddingTop: 8,
            paddingBottom: 10,
            overflow: "hidden",
            backgroundColor: colors.wood,
            borderWidth: 1,
            borderColor: isDark ? colors.goldMuted : "#F3C892",
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.28,
            shadowRadius: 24,
            elevation: 8,
          },
          tabBarBackground: () => (
            <LinearGradient
              colors={
                isDark
                  ? [colors.woodDark, colors.secondary, colors.woodDark]
                  : ["#FFE7BD", colors.wood, "#EFC487"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="characters"
          options={{
            title: "Add character",
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="smile" />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Create story",
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="book-open" />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Library",
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="archive" />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRoot: {
    flex: 1,
  },
  iconWrap: {
    width: 48,
    height: 34,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
