import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useStoryStudio } from "@/context/StoryContext";
import { useColors } from "@/hooks/useColors";

export default function LibraryScreen() {
  const colors = useColors();
  const { savedStories, removeStory, openStory } = useStoryStudio();

  const handleRead = (story: (typeof savedStories)[number]) => {
    openStory(story);
    router.push({
      pathname: "/book-reader",
      params: { storyId: story.id },
    });
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.kicker, { color: colors.primary }]}>Library</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Saved stories</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        A calm shelf for stories your family wants to revisit.
      </Text>

      <View style={styles.grid}>
        {savedStories.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="book" color={colors.mutedForeground} size={26} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Generate a story and save it to build your family library.
            </Text>
          </View>
        ) : (
          savedStories.map((story) => (
            <View
              key={story.id}
              style={[styles.bookCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {/* Cover thumbnail */}
              <View style={[styles.coverThumb, { backgroundColor: "#2C1B0E" }]}>
                {story.coverImageUrl ? (
                  <Image
                    source={{ uri: story.coverImageUrl }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                ) : story.characterPhotoUri ? (
                  <Image
                    source={{ uri: story.characterPhotoUri }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.coverPlaceholder, { backgroundColor: colors.secondary }]}>
                    <Feather name="book-open" color={colors.primary} size={22} />
                  </View>
                )}
                <View style={[styles.coverSpine, { backgroundColor: colors.primary }]} />
                <View style={styles.coverGradient} />
                <Text style={styles.coverPageCount}>{story.pages.length}p</Text>
              </View>

              {/* Book details */}
              <View style={styles.bookBody}>
                <Text style={[styles.bookFor, { color: colors.primary }]}>
                  For {story.characterName}
                </Text>
                <Text
                  onPress={() => handleRead(story)}
                  style={[styles.bookTitle, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {story.title}
                </Text>
                <Text style={[styles.bookPreview, { color: colors.mutedForeground }]} numberOfLines={3}>
                  {story.pages[0]?.text}
                </Text>

                <View style={styles.bookActions}>
                  <Pressable
                    onPress={() => handleRead(story)}
                    style={({ pressed }) => [
                      styles.readButton,
                      { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 },
                    ]}
                  >
                    <Feather name="book-open" color="white" size={15} />
                    <Text style={styles.readButtonText}>Read</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => removeStory(story.id)}
                    style={({ pressed }) => [styles.removeButton, { opacity: pressed ? 0.6 : 1 }]}
                    hitSlop={12}
                  >
                    <Feather name="trash-2" color={colors.mutedForeground} size={16} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: 22,
    paddingTop: Platform.OS === "web" ? 84 : 22,
    paddingBottom: 120,
  },
  kicker: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: -1,
    marginTop: 8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 22,
  },
  grid: { gap: 16 },
  empty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 28,
    padding: 34,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 21,
  },
  bookCard: {
    borderWidth: 1,
    borderRadius: 26,
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 180,
  },
  coverThumb: {
    width: 96,
    position: "relative",
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  coverSpine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    opacity: 0.7,
  },
  coverGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: "rgba(20,12,6,0.55)",
  },
  coverPageCount: {
    position: "absolute",
    bottom: 8,
    right: 8,
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },
  bookBody: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  bookFor: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  bookTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  bookPreview: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  bookActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  readButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
  },
  readButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "white",
  },
  removeButton: {
    padding: 6,
  },
});
