import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useStoryStudio } from "@/context/StoryContext";
import type { StoryPage } from "@/context/StoryContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const PAGE_COLORS = [
  { bg: "#F5EDE2", blob1: "rgba(191,216,196,0.55)", blob2: "rgba(242,201,183,0.45)" },
  { bg: "#EEF5F1", blob1: "rgba(207,228,232,0.55)", blob2: "rgba(255,230,195,0.45)" },
  { bg: "#FBF3EC", blob1: "rgba(242,201,183,0.55)", blob2: "rgba(191,216,196,0.40)" },
  { bg: "#EDF4F6", blob1: "rgba(207,228,232,0.60)", blob2: "rgba(255,230,195,0.40)" },
  { bg: "#F8F2EA", blob1: "rgba(255,230,195,0.55)", blob2: "rgba(191,216,196,0.40)" },
  { bg: "#F0F5EF", blob1: "rgba(191,216,196,0.60)", blob2: "rgba(242,201,183,0.40)" },
];

type PageItem =
  | { type: "cover" }
  | { type: "page"; page: StoryPage }
  | { type: "end" };

const ids = {
  screen: "book-reader-screen",
  pages: "book-reader-pages",
  closeButton: "book-reader-close-button",
  previousButton: "book-reader-previous-button",
  nextButton: "book-reader-next-button",
  saveButton: "book-reader-save-button",
  progressDots: "book-reader-progress-dots",
};

export default function BookReaderScreen() {
  const insets = useSafeAreaInsets();
  const { currentStory, saveCurrentStory, savedStories } = useStoryStudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  if (!currentStory) {
    return (
      <View style={[styles.center, { backgroundColor: "#FFFCF6" }]}>
        <Text style={styles.noStory}>No story loaded. Go generate one!</Text>
        <Pressable
          testID={ids.closeButton}
          nativeID={ids.closeButton}
          onPress={() => router.back()}
          style={styles.closeBtn}
        >
          <Feather name="x" color="#8B7B5A" size={22} />
        </Pressable>
      </View>
    );
  }

  const items: PageItem[] = [
    { type: "cover" },
    ...currentStory.pages.map((page) => ({ type: "page" as const, page })),
    { type: "end" },
  ];

  const isSaved = savedStories.some((s) => s.id === currentStory.id);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const goNext = () => {
    if (currentIndex < items.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const renderCover = () => (
    <View testID="book-reader-cover" nativeID="book-reader-cover" style={[styles.page, { backgroundColor: "#2C1B0E" }]}>
      {currentStory.coverImageUrl ? (
        <Image
          source={{ uri: currentStory.coverImageUrl }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.coverImagePlaceholder}>
          <View style={[styles.blob, { backgroundColor: "rgba(191,216,196,0.25)", top: -60, left: -40, width: 260, height: 200 }]} />
          <View style={[styles.blob, { backgroundColor: "rgba(242,201,183,0.25)", top: 20, right: -40, width: 220, height: 180 }]} />
          <View style={[styles.blob, { backgroundColor: "rgba(207,228,232,0.20)", bottom: 40, left: 20, width: 240, height: 190 }]} />
          {currentStory.characterPhotoUri ? (
            <Image
              source={{ uri: currentStory.characterPhotoUri }}
              style={styles.coverCharacterPhoto}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverIconWrap}>
              <Feather name="book-open" color="rgba(255,230,195,0.8)" size={68} />
            </View>
          )}
        </View>
      )}
      <View style={styles.coverOverlay}>
        <Text style={styles.coverFor}>A story for</Text>
        <Text style={styles.coverName}>{currentStory.characterName}</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverTitle}>{currentStory.title}</Text>
        <Text style={styles.coverSubtitle}>A Kahani story · {currentStory.pages.length} pages</Text>
      </View>
    </View>
  );

  const renderStoryPage = (page: StoryPage, index: number) => {
    const palette = PAGE_COLORS[index % PAGE_COLORS.length]!;
    return (
      <View style={[styles.page, { backgroundColor: palette.bg }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.blob, { backgroundColor: palette.blob1, top: -80, left: -60, width: 300, height: 240 }]} />
          <View style={[styles.blob, { backgroundColor: palette.blob2, bottom: -40, right: -50, width: 280, height: 220 }]} />
        </View>

        <View style={[styles.pageContent, { paddingTop: insets.top + 28 }]}>
          {currentStory.characterPhotoUri ? (
            <View style={styles.characterFrame}>
              <Image
                source={{ uri: currentStory.characterPhotoUri }}
                style={styles.characterPhoto}
                resizeMode="cover"
              />
              <View style={styles.characterGlow} />
            </View>
          ) : (
            <View style={[styles.characterFrame, styles.characterPhotoEmpty]}>
              <Feather name="user" color="#C8B89A" size={44} />
            </View>
          )}

          <View style={styles.illustrationCaption}>
            <Text style={styles.illustrationText}>{page.illustrationPrompt}</Text>
          </View>

          <View style={styles.textBubble}>
            <Text style={styles.pageText}>{page.text}</Text>
          </View>

          <Text style={styles.pageNumber}>
            {page.pageNumber} / {currentStory.pages.length}
          </Text>
        </View>
      </View>
    );
  };

  const renderEnd = () => (
    <View testID="book-reader-end" nativeID="book-reader-end" style={[styles.page, { backgroundColor: "#F8F2EA" }]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.blob, { backgroundColor: "rgba(191,216,196,0.50)", top: -80, left: -60, width: 300, height: 240 }]} />
        <View style={[styles.blob, { backgroundColor: "rgba(255,230,195,0.50)", bottom: -40, right: -50, width: 280, height: 220 }]} />
      </View>

      <View style={[styles.pageContent, { paddingTop: insets.top + 40, justifyContent: "center", alignItems: "center" }]}>
        <View style={styles.endIcon}>
          <Feather name="star" color="#8B7B5A" size={30} />
        </View>
        <Text style={styles.endTitle}>The End</Text>
        <Text style={styles.endName}>{currentStory.title}</Text>

        <View style={styles.reflectionCard}>
          <Text style={styles.reflectionLabel}>Talk about it together</Text>
          <Text style={styles.reflectionText}>{currentStory.reflectionQuestion}</Text>
        </View>

        {!isSaved && (
          <Pressable
            testID={ids.saveButton}
            nativeID={ids.saveButton}
            onPress={saveCurrentStory}
            style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Feather name="bookmark" color="white" size={18} />
            <Text style={styles.saveBtnText}>Save to library</Text>
          </Pressable>
        )}
        {isSaved && (
          <View style={styles.savedBadge}>
            <Feather name="check" color="#5E7A60" size={16} />
            <Text style={styles.savedBadgeText}>Saved to your library</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View testID={ids.screen} nativeID={ids.screen} style={styles.root}>
      <FlatList
        testID={ids.pages}
        nativeID={ids.pages}
        ref={flatListRef}
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item, index }) => {
          if (item.type === "cover") return renderCover();
          if (item.type === "page") return renderStoryPage(item.page, index - 1);
          return renderEnd();
        }}
      />

      {/* Close button */}
      <Pressable
        testID={ids.closeButton}
        nativeID={ids.closeButton}
        onPress={() => router.back()}
        style={[styles.closeButton, { top: insets.top + 16 }]}
      >
        <Feather name="x" color="white" size={20} />
      </Pressable>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <Pressable
          testID={ids.previousButton}
          nativeID={ids.previousButton}
          onPress={goPrev}
          style={[styles.navButton, styles.navLeft, { top: SCREEN_HEIGHT / 2 - 22 }]}
        >
          <Feather name="chevron-left" color="white" size={24} />
        </Pressable>
      )}
      {currentIndex < items.length - 1 && (
        <Pressable
          testID={ids.nextButton}
          nativeID={ids.nextButton}
          onPress={goNext}
          style={[styles.navButton, styles.navRight, { top: SCREEN_HEIGHT / 2 - 22 }]}
        >
          <Feather name="chevron-right" color="white" size={24} />
        </Pressable>
      )}

      {/* Progress dots */}
      <View testID={ids.progressDots} nativeID={ids.progressDots} style={[styles.dots, { bottom: insets.bottom + 24 }]}>
        {items.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === currentIndex ? "rgba(139,123,90,0.9)" : "rgba(139,123,90,0.25)" },
              i === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  noStory: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: "#8B7B5A",
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  pageContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 100,
    gap: 20,
  },

  // Cover
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  coverImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3D2B1F",
    overflow: "hidden",
  },
  coverCharacterPhoto: {
    width: 250,
    height: 250,
    borderRadius: 999,
    borderWidth: 7,
    borderColor: "rgba(255,230,195,0.55)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  coverIconWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,230,195,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 100,
    paddingHorizontal: 28,
    paddingTop: 40,
    backgroundColor: "rgba(20,12,6,0.76)",
    alignItems: "center",
    gap: 8,
  },
  coverFor: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,230,195,0.75)",
    letterSpacing: 0.5,
  },
  coverName: {
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    color: "#FFE6C3",
    letterSpacing: -1,
  },
  coverDivider: {
    width: 48,
    height: 2,
    backgroundColor: "rgba(255,230,195,0.35)",
    borderRadius: 1,
    marginVertical: 4,
  },
  coverTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "white",
    textAlign: "center",
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  coverSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
  },

  // Story page
  characterFrame: {
    width: 190,
    height: 190,
    borderRadius: 56,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 16,
  },
  characterPhoto: {
    width: "100%",
    height: "100%",
  },
  characterPhotoEmpty: {
    backgroundColor: "rgba(244,238,228,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  characterGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },
  illustrationCaption: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: "100%",
  },
  illustrationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#8B7B5A",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 18,
  },
  textBubble: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    justifyContent: "center",
  },
  pageText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: Platform.OS === "web" ? 22 : 20,
    lineHeight: Platform.OS === "web" ? 34 : 32,
    color: "#2C2116",
    textAlign: "center",
  },
  pageNumber: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(139,123,90,0.6)",
  },

  // End page
  endIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,230,195,0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  endTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    color: "#2C2116",
    letterSpacing: -1,
  },
  endName: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#8B7B5A",
    textAlign: "center",
  },
  reflectionCard: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 22,
    gap: 10,
    marginTop: 8,
    width: "100%",
  },
  reflectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#BFD8C4",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  reflectionText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#2C2116",
    lineHeight: 27,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#8B7B5A",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 22,
    marginTop: 8,
  },
  saveBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "white",
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  savedBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#5E7A60",
  },

  // Navigation
  closeButton: {
    position: "absolute",
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,230,195,0.3)",
  },
  navButton: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.34)",
    alignItems: "center",
    justifyContent: "center",
  },
  navLeft: {
    left: 16,
  },
  navRight: {
    right: 16,
  },
  dots: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
  },
});
