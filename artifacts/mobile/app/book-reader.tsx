import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  IconButton,
  PlaceholderArt,
  ProgressDots,
  ReaderNavButton,
  ThemeToggle,
  cardShadow,
  serifFamily,
} from "@/components/KahaniDesign";
import tokens from "@/constants/colors";
import { useStoryStudio, type StoryPage } from "@/context/StoryContext";
import { useKahaniTheme } from "@/context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type PageItem =
  | { type: "cover" }
  | { type: "page"; page: StoryPage }
  | { type: "end" };

export default function BookReaderScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useKahaniTheme();
  const { currentStory, saveCurrentStory, savedStories } = useStoryStudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<PageItem>>(null);

  const items = useMemo<PageItem[]>(
    () =>
      currentStory
        ? [
            { type: "cover" },
            ...currentStory.pages.map((page) => ({ type: "page" as const, page })),
            { type: "end" },
          ]
        : [],
    [currentStory],
  );

  if (!currentStory) {
    return (
      <View
        style={[
          styles.emptyRoot,
          { backgroundColor: colors.background, paddingTop: insets.top + 24 },
        ]}
      >
        <IconButton icon="chevron-left" onPress={() => router.back()} />
        <Text style={[styles.emptyText, { color: colors.foreground }]}>
          No story loaded.
        </Text>
      </View>
    );
  }

  const isSaved = savedStories.some((story) => story.id === currentStory.id);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const goTo = (index: number) => {
    flatListRef.current?.scrollToIndex({
      index: Math.max(0, Math.min(items.length - 1, index)),
      animated: true,
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => String(index)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item, index }) => {
          if (item.type === "cover") {
            return <CoverPage pageCount={currentStory.pages.length} />;
          }
          if (item.type === "end") {
            return (
              <EndPage
                saved={isSaved}
                title={currentStory.title}
                question={currentStory.reflectionQuestion}
                onSave={saveCurrentStory}
              />
            );
          }
          return (
            <StoryReaderPage
              page={item.page}
              index={index - 1}
              total={currentStory.pages.length}
              fallbackImage={currentStory.coverImageUrl ?? currentStory.characterPhotoUri}
            />
          );
        }}
      />

      <View style={[styles.readerTop, { top: insets.top + 16 }]}>
        <IconButton icon="chevron-left" onPress={() => router.back()} />
        <ThemeToggle />
      </View>

      <View style={[styles.navRow, { bottom: insets.bottom + 82 }]}>
        <ReaderNavButton
          direction="left"
          disabled={currentIndex === 0}
          onPress={() => goTo(currentIndex - 1)}
        />
        <View
          style={[
            styles.pageCount,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="book-open" color={colors.primary} size={24} />
          <Text style={[styles.pageCountText, { color: colors.foreground }]}>
            {currentIndex + 1} / {items.length}
          </Text>
        </View>
        <ReaderNavButton
          direction="right"
          disabled={currentIndex === items.length - 1}
          onPress={() => goTo(currentIndex + 1)}
        />
      </View>

      <View style={[styles.progressWrap, { bottom: insets.bottom + 52 }]}>
        <ProgressDots count={items.length} index={currentIndex} />
      </View>
    </View>
  );
}

function CoverPage({ pageCount }: { pageCount: number }) {
  const { colors } = useKahaniTheme();
  const { currentStory } = useStoryStudio();
  if (!currentStory) return null;

  return (
    <View style={styles.page}>
      <View style={styles.readerContent}>
        <Text style={[styles.readerTitle, { color: colors.foreground }]}>
          {currentStory.title}
        </Text>
        <View
          style={[
            styles.heroImage,
            { borderColor: colors.border, backgroundColor: colors.secondary },
            cardShadow(colors.shadow),
          ]}
        >
          {currentStory.coverImageUrl ? (
            <Image
              source={{ uri: currentStory.coverImageUrl }}
              style={styles.fill}
              resizeMode="cover"
            />
          ) : (
            <PlaceholderArt title={currentStory.title} />
          )}
        </View>
        <Text style={[styles.storyText, { color: colors.foreground }]}>
          A story for {currentStory.characterName}.
        </Text>
        <Text style={[styles.readerMeta, { color: colors.mutedForeground }]}>
          {pageCount} illustrated pages
        </Text>
      </View>
    </View>
  );
}

function StoryReaderPage({
  page,
  index,
  total,
  fallbackImage,
}: {
  page: StoryPage;
  index: number;
  total: number;
  fallbackImage?: string;
}) {
  const { colors } = useKahaniTheme();
  const pageWithImage = page as StoryPage & { imageUrl?: string; imageUri?: string };
  const imageUri = pageWithImage.imageUrl ?? pageWithImage.imageUri ?? fallbackImage;

  return (
    <View style={styles.page}>
      <View style={[styles.readerContent, styles.storyPageContent]}>
        <View
          style={[
            styles.pageImage,
            { borderColor: colors.border, backgroundColor: colors.secondary },
            cardShadow(colors.shadow),
          ]}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.fill} resizeMode="cover" />
          ) : (
            <PlaceholderArt title={page.illustrationPrompt} />
          )}
        </View>
        <Text style={[styles.storyText, { color: colors.foreground }]}>
          {page.text}
        </Text>
        <Text style={[styles.readerMeta, { color: colors.mutedForeground }]}>
          Page {index + 1} of {total}
        </Text>
      </View>
    </View>
  );
}

function EndPage({
  saved,
  title,
  question,
  onSave,
}: {
  saved: boolean;
  title: string;
  question: string;
  onSave: () => void;
}) {
  const { colors } = useKahaniTheme();

  return (
    <View style={styles.page}>
      <View style={[styles.readerContent, styles.endContent]}>
        <Feather name="bookmark" color={colors.primary} size={56} />
        <Text style={[styles.endTitle, { color: colors.foreground }]}>The End</Text>
        <Text style={[styles.endBook, { color: colors.mutedForeground }]}>{title}</Text>
        <View
          style={[
            styles.questionBox,
            { backgroundColor: colors.card, borderColor: colors.border },
            cardShadow(colors.shadow),
          ]}
        >
          <Text style={[styles.questionLabel, { color: colors.gold }]}>
            Talk about it together
          </Text>
          <Text style={[styles.questionText, { color: colors.foreground }]}>
            {question}
          </Text>
        </View>
        <Pressable
          onPress={onSave}
          disabled={saved}
          style={[
            styles.saveButton,
            { backgroundColor: saved ? colors.secondary : colors.primary },
          ]}
        >
          <Feather
            name={saved ? "check" : "bookmark"}
            color={saved ? colors.secondaryForeground : colors.primaryForeground}
            size={18}
          />
          <Text
            style={[
              styles.saveText,
              {
                color: saved
                  ? colors.secondaryForeground
                  : colors.primaryForeground,
              },
            ]}
          >
            {saved ? "Saved to library" : "Save to library"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  emptyRoot: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 24,
  },
  emptyText: {
    fontFamily: serifFamily(),
    fontSize: 28,
  },
  page: {
    width: SCREEN_WIDTH,
    minHeight: SCREEN_HEIGHT,
  },
  readerContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 118,
    paddingBottom: 156,
    alignItems: "center",
  },
  storyPageContent: {
    paddingTop: 112,
  },
  readerTop: {
    position: "absolute",
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  readerTitle: {
    fontFamily: serifFamily(),
    fontSize: 34,
    lineHeight: 41,
    textAlign: "center",
    marginBottom: 22,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 0.86,
    borderRadius: 26,
    borderWidth: 1,
    overflow: "hidden",
  },
  pageImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  fill: {
    width: "100%",
    height: "100%",
  },
  storyText: {
    alignSelf: "stretch",
    fontFamily: serifFamily(),
    fontSize: 23,
    lineHeight: 35,
    marginTop: 24,
  },
  readerMeta: {
    fontFamily: tokens.typography.sansMedium,
    fontSize: 15,
    marginTop: 16,
  },
  navRow: {
    position: "absolute",
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 46,
    borderRadius: 23,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  pageCountText: {
    fontFamily: tokens.typography.sansMedium,
    fontSize: 17,
  },
  progressWrap: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  endContent: {
    justifyContent: "center",
  },
  endTitle: {
    fontFamily: serifFamily(),
    fontSize: 48,
    marginTop: 20,
  },
  endBook: {
    fontFamily: tokens.typography.sansMedium,
    fontSize: 17,
    marginTop: 8,
    textAlign: "center",
  },
  questionBox: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    marginTop: 32,
  },
  questionLabel: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  questionText: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 20,
    lineHeight: 30,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginTop: 24,
  },
  saveText: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 15,
  },
});
