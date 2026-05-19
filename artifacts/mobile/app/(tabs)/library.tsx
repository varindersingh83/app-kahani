import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  KahaniScreen,
  StoryCard,
  ThemeToggle,
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
  const { savedStories, currentStory, openStory, removeStory } =
    useStoryStudio();

  const featured = savedStories[0] ?? currentStory;

  const handleRead = (story: Story) => {
    openStory(story);
    router.push("/book-reader");
  };

  const confirmDelete = (story: Story) => {
    Alert.alert(
      "Delete book?",
      `Remove "${story.title}" from your library?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeStory(story.id),
        },
      ],
    );
  };

  return (
    <KahaniScreen withLeaves={false}>
      <View style={styles.topControls}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>
          Library
        </Text>
        <ThemeToggle />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Latest
      </Text>
      {featured ? (
        <StoryCard
          featured
          title={featured.title}
          description={featured.pages[0]?.text}
          imageUri={featured.coverImageUrl ?? featured.characterPhotoUri}
          pages={featured.pages.length}
          onPress={() => handleRead(featured)}
          testID="library-featured-story"
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
      </View>

      <View style={styles.bookList}>
        {savedStories.length > 0
          ? savedStories.map((story) => (
              <View key={story.id}>
                <StoryCard
                  title={story.title}
                  description={story.createdAt ? "Just now" : undefined}
                  imageUri={story.coverImageUrl ?? story.characterPhotoUri}
                  pages={story.pages.length}
                  onPress={() => handleRead(story)}
                  testID={`library-story-${story.title}`}
                  onDelete={() => confirmDelete(story)}
                />
              </View>
            ))
          : sampleBooks.map((book) => (
              <View key={book.title}>
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
  topControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  screenTitle: {
    fontFamily: serifFamily(),
    fontSize: 34,
    lineHeight: 40,
  },
  sectionTitle: {
    fontFamily: serifFamily(),
    fontSize: 25,
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
    marginTop: 34,
    marginBottom: 14,
  },
  allBooksTitle: {
    fontFamily: serifFamily(),
    fontSize: 28,
  },
  bookList: {
    gap: 14,
  },
});
