import { Feather } from "@expo/vector-icons";
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
          backgroundColor: focused ? colors.secondary : "transparent",
          borderColor: focused ? colors.border : "transparent",
        },
      ]}
    >
      <Feather
        name={name}
        color={focused ? colors.primary : colors.bark}
        size={22}
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
            fontFamily: tokens.typography.sansSemiBold,
            fontSize: 11,
            lineHeight: 14,
            marginTop: 2,
            textAlign: "center",
          },
          tabBarItemStyle: {
            flex: 1,
            height: 62,
            minWidth: 0,
            paddingHorizontal: 0,
            paddingVertical: 0,
            alignItems: "center",
            justifyContent: "center",
          },
          tabBarIconStyle: {
            width: 48,
            height: 30,
            alignItems: "center",
            justifyContent: "center",
          },
          tabBarStyle: {
            marginHorizontal: 24,
            marginBottom: tabBarBottom,
            height: 68,
            borderTopWidth: 0,
            borderRadius: 28,
            paddingHorizontal: 10,
            paddingTop: 7,
            paddingBottom: 7,
            overflow: "hidden",
            backgroundColor: isDark ? colors.card : colors.elevated,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.22,
            shadowRadius: 18,
            elevation: 6,
          },
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
    width: 42,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
