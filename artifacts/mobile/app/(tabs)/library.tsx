import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  KahaniHeader,
  KahaniScreen,
  StoryCard,
  cardShadow,
  serifFamily,
} from "@/components/KahaniDesign";
import tokens from "@/constants/colors";
import { useStoryStudio, type Story } from "@/context/StoryContext";
import { useKahaniTheme } from "@/context/ThemeContext";

const sampleBooks = [
  {
    title: "Benny and The Brave Day",
    text: "A brave bear and a tiny bunny learn how courage grows.",
    pages: 24,
  },
  {
    title: "Luna's Pocket of Stars",
    text: "Luna keeps a jar of starlight for the darkest paths.",
    pages: 20,
  },
  {
    title: "The Treehouse Adventure",
    text: "A hidden house in the branches opens to a gentle mystery.",
    pages: 28,
  },
  {
    title: "Across the Hills We Go",
    text: "A small explorer follows a golden path through the mountains.",
    pages: 26,
  },
];

export default function LibraryScreen() {
  const { colors } = useKahaniTheme();
  const { savedStories, currentStory, openStory } = useStoryStudio();

  const featured = savedStories[0] ?? currentStory;

  const handleRead = (story: Story) => {
    openStory(story);
    router.push("/book-reader");
  };

  return (
    <KahaniScreen>
      <KahaniHeader title="My Library" subtitle="Your stories, made with love" />

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Newly created
      </Text>
      {featured ? (
        <StoryCard
          featured
          title={featured.title}
          description={featured.pages[0]?.text}
          imageUri={featured.coverImageUrl ?? featured.characterPhotoUri}
          pages={featured.pages.length}
          onPress={() => handleRead(featured)}
        />
      ) : (
        <View
          style={[
            styles.emptyFeatured,
            { backgroundColor: colors.card, borderColor: colors.border },
            cardShadow(colors.shadow),
          ]}
        >
          <Feather name="book-open" color={colors.primary} size={32} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Your first story will live here.
          </Text>
          <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
            Create and save a picture book to build your family library.
          </Text>
        </View>
      )}

      <View style={styles.allBooksHeader}>
        <Text style={[styles.allBooksTitle, { color: colors.foreground }]}>
          All books
        </Text>
        <View style={styles.filterRow}>
          <Pressable
            style={[
              styles.filterPill,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.filterText, { color: colors.foreground }]}>
              Recently created
            </Text>
            <Feather name="chevron-down" color={colors.bark} size={18} />
          </Pressable>
          <Pressable
            style={[
              styles.filterIcon,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Feather name="sliders" color={colors.bark} size={20} />
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        {savedStories.length > 0
          ? savedStories.map((story) => (
              <View key={story.id} style={styles.gridItem}>
                <StoryCard
                  title={story.title}
                  description={story.createdAt ? "Just now" : undefined}
                  imageUri={story.coverImageUrl ?? story.characterPhotoUri}
                  pages={story.pages.length}
                  onPress={() => handleRead(story)}
                />
              </View>
            ))
          : sampleBooks.map((book) => (
              <View key={book.title} style={styles.gridItem}>
                <StoryCard
                  title={book.title}
                  description={book.text}
                  pages={book.pages}
                />
              </View>
            ))}
      </View>
    </KahaniScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: serifFamily(),
    fontSize: 26,
    marginBottom: 14,
  },
  emptyFeatured: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontFamily: serifFamily(),
    fontSize: 26,
    textAlign: "center",
  },
  emptyCopy: {
    fontFamily: tokens.typography.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  allBooksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 30,
    marginBottom: 14,
  },
  allBooksTitle: {
    fontFamily: serifFamily(),
    fontSize: 30,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterPill: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  filterText: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 13,
  },
  filterIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  gridItem: {
    width: "48%",
  },
});
