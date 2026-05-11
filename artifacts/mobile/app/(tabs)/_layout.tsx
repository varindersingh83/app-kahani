import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

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
  const isDark = colors.scheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontFamily: tokens.typography.serif,
          fontSize: 14,
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarStyle: {
          position: "absolute",
          left: 24,
          right: 24,
          bottom: Platform.OS === "ios" ? 24 : 18,
          height: 96,
          borderTopWidth: 0,
          borderRadius: 48,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 16 : 10,
          overflow: "hidden",
          backgroundColor: colors.wood,
          borderWidth: 1,
          borderColor: isDark ? colors.goldMuted : "#F3C892",
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 14 },
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
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 58,
    height: 44,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
