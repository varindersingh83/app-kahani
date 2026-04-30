import { useGenerateStory } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useStoryStudio } from "@/context/StoryContext";
import { useColors } from "@/hooks/useColors";

type StoryMode = "behavior" | "random";

export default function StudioScreen() {
  const colors = useColors();
  const {
    characters,
    selectedCharacter,
    selectedCharacterId,
    selectCharacter,
    currentStory,
    createGeneratedStory,
    saveCurrentStory,
    savedStories,
  } = useStoryStudio();
  const [mode, setMode] = useState<StoryMode>("behavior");
  const [prompt, setPrompt] = useState("");

  const mutation = useGenerateStory({
    mutation: {
      onSuccess: async (story) => {
        await createGeneratedStory({
          title: story.title,
          pages: story.pages,
          reflectionQuestion: story.reflectionQuestion,
          coverImageUrl: story.coverImageUrl ?? undefined,
          characterName: selectedCharacter?.name ?? "your child",
          characterPhotoUri: selectedCharacter?.photoUri ?? undefined,
        });
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
      onError: () => {
        Alert.alert("Story not ready", "The story service could not finish. Try again in a moment.");
      },
    },
  });

  const generate = () => {
    if (!selectedCharacter) {
      Alert.alert("Add a character", "Create a character before generating a story.");
      router.push("/(tabs)/characters");
      return;
    }
    mutation.mutate({
      data: {
        mode,
        prompt: prompt.trim() || undefined,
        character: {
          name: selectedCharacter.name,
          photoUri: selectedCharacter.photoUri,
        },
      },
    });
  };

  const save = async () => {
    await saveCurrentStory();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const isSaved = currentStory
    ? savedStories.some((story) => story.id === currentStory.id)
    : false;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.kicker, { color: colors.primary }]}>Story Studio</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Gentle story time</Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: colors.accent }]}>
          <Feather name="sun" size={22} color={colors.accentForeground} />
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Choose a character</Text>
        <View style={styles.profileRow}>
          {[0, 1, 2].map((slot) => {
            const character = characters[slot];
            const selected = character?.id === selectedCharacterId;
            if (character) {
              return (
                <Pressable
                  key={character.id}
                  onPress={() => selectCharacter(character.id)}
                  style={styles.profileSlot}
                >
                  <View
                    style={[
                      styles.profileAvatar,
                      {
                        borderColor: selected ? colors.primary : "transparent",
                        borderWidth: selected ? 3 : 0,
                      },
                    ]}
                  >
                    {character.photoUri ? (
                      <Image source={{ uri: character.photoUri }} style={styles.profileAvatarInner} />
                    ) : (
                      <View
                        style={[
                          styles.profileAvatarInner,
                          { backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" },
                        ]}
                      >
                        <Feather name="user" color={colors.primary} size={26} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.profileName, { color: selected ? colors.primary : colors.foreground }]}
                    numberOfLines={1}
                  >
                    {character.name}
                  </Text>
                </Pressable>
              );
            }
            return (
              <View key={`placeholder-${slot}`} style={styles.profileSlot}>
                <View
                  style={[
                    styles.profileAvatar,
                    styles.profileAvatarEmpty,
                    { backgroundColor: colors.secondary, borderColor: colors.border },
                  ]}
                >
                  <Feather name="user" color={colors.border} size={26} />
                </View>
                <Text style={[styles.profileName, { color: colors.border }]}>· · ·</Text>
              </View>
            );
          })}
          <Pressable onPress={() => router.push("/(tabs)/characters")} style={styles.profileSlot}>
            <View
              style={[
                styles.profileAvatar,
                styles.profileAvatarAdd,
                { backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
            >
              <Feather name="plus" color={colors.mutedForeground} size={28} />
            </View>
            <Text style={[styles.profileName, { color: colors.mutedForeground }]}>Add</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Story type</Text>
        <View style={styles.modeRow}>
          {(["behavior", "random"] as StoryMode[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setMode(item)}
              style={[
                styles.modeButton,
                { backgroundColor: mode === item ? colors.primary : colors.secondary },
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  { color: mode === item ? colors.primaryForeground : colors.secondaryForeground },
                ]}
              >
                {item === "behavior" ? "Behavior support" : "Random story"}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          multiline
          placeholder={
            mode === "behavior"
              ? "Example: sharing toys, bedtime resistance, using gentle hands"
              : "Optional idea, theme, animal, or place"
          }
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.promptInput,
            { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background },
          ]}
        />

        <Pressable
          onPress={generate}
          disabled={mutation.isPending}
          style={({ pressed }) => [
            styles.generateButton,
            { backgroundColor: colors.primary, opacity: pressed || mutation.isPending ? 0.75 : 1 },
          ]}
        >
          {mutation.isPending ? (
            <View style={{ alignItems: "center", gap: 8 }}>
              <ActivityIndicator color={colors.primaryForeground} />
              <Text style={[styles.generateText, { color: colors.primaryForeground, fontSize: 13 }]}>
                Writing your story… this takes a moment
              </Text>
            </View>
          ) : (
            <>
              <Feather name="feather" color={colors.primaryForeground} size={18} />
              <Text style={[styles.generateText, { color: colors.primaryForeground }]}>
                Generate picture book
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {currentStory ? (
        <View style={[styles.bookCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Book cover thumbnail */}
          <View style={styles.bookCoverRow}>
            <View style={styles.bookCoverThumb}>
              {currentStory.coverImageUrl ? (
                <Image
                  source={{ uri: currentStory.coverImageUrl }}
                  style={styles.bookCoverImage}
                  resizeMode="cover"
                />
              ) : currentStory.characterPhotoUri ? (
                <Image
                  source={{ uri: currentStory.characterPhotoUri }}
                  style={styles.bookCoverImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.bookCoverPlaceholder, { backgroundColor: colors.secondary }]}>
                  <Feather name="book-open" color={colors.primary} size={26} />
                </View>
              )}
              <View style={[styles.bookSpineBar, { backgroundColor: colors.primary }]} />
            </View>

            <View style={styles.bookMeta}>
              <Text style={[styles.bookFor, { color: colors.primary }]}>
                For {currentStory.characterName}
              </Text>
              <Text
                onPress={() =>
                  router.push({
                    pathname: "/book-reader",
                    params: { storyId: currentStory.id },
                  })
                }
                style={[styles.bookTitle, { color: colors.foreground }]}
                numberOfLines={3}
              >
                {currentStory.title}
              </Text>
              <Text style={[styles.bookPageCount, { color: colors.mutedForeground }]}>
                {currentStory.pages.length} pages · picture book
              </Text>
            </View>
          </View>

          {/* Preview of page 1 */}
          <View style={[styles.previewBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.previewLabel, { color: colors.primary }]}>PAGE 1</Text>
            <Text style={[styles.previewText, { color: colors.foreground }]} numberOfLines={4}>
              {currentStory.pages[0]?.text}
            </Text>
          </View>

          {/* Reflection */}
          <View style={[styles.questionBox, { backgroundColor: colors.accent }]}>
            <Text style={[styles.questionLabel, { color: colors.accentForeground }]}>Reflection</Text>
            <Text style={[styles.questionText, { color: colors.accentForeground }]}>
              {currentStory.reflectionQuestion}
            </Text>
          </View>

          {/* Actions */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/book-reader",
                params: { storyId: currentStory.id },
              })
            }
            style={({ pressed }) => [
              styles.openButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <Feather name="book-open" color={colors.primaryForeground} size={18} />
            <Text style={[styles.openButtonText, { color: colors.primaryForeground }]}>
              Read the book
            </Text>
          </Pressable>

          <View style={styles.storyActions}>
            <Pressable
              onPress={save}
              disabled={isSaved}
              style={[styles.secondaryButton, { backgroundColor: colors.secondary }]}
            >
              <Feather name={isSaved ? "check" : "bookmark"} color={colors.secondaryForeground} size={17} />
              <Text style={[styles.secondaryButtonText, { color: colors.secondaryForeground }]}>
                {isSaved ? "Saved" : "Save"}
              </Text>
            </Pressable>
            <Pressable
              onPress={generate}
              disabled={mutation.isPending}
              style={[styles.secondaryButton, { backgroundColor: colors.secondary }]}
            >
              <Feather name="refresh-cw" color={colors.secondaryForeground} size={17} />
              <Text style={[styles.secondaryButtonText, { color: colors.secondaryForeground }]}>New story</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.emptyStory, { borderColor: colors.border }]}>
          <Feather name="book-open" color={colors.mutedForeground} size={26} />
          <Text style={[styles.emptyStoryText, { color: colors.mutedForeground }]}>
            Generate a personalised picture book for your little one — 12 illustrated pages, just for them.
          </Text>
        </View>
      )}
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  kicker: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    letterSpacing: -1,
    marginTop: 6,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    borderWidth: 1,
    borderRadius: 30,
    padding: 18,
    gap: 14,
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    marginTop: 4,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  profileSlot: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  profileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 20,
    overflow: "hidden",
  },
  profileAvatarInner: {
    width: "100%",
    height: "100%",
  },
  profileAvatarEmpty: {
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarAdd: {
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    textAlign: "center",
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  modeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    textAlign: "center",
  },
  promptInput: {
    minHeight: 116,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    lineHeight: 21,
    textAlignVertical: "top",
  },
  generateButton: {
    minHeight: 58,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  generateText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    textAlign: "center",
  },

  // Book card
  bookCard: {
    borderWidth: 1,
    borderRadius: 32,
    padding: 20,
    marginTop: 18,
    gap: 16,
  },
  bookCoverRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  bookCoverThumb: {
    width: 90,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  bookCoverImage: {
    width: "100%",
    height: "100%",
  },
  bookCoverPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  bookSpineBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    opacity: 0.7,
  },
  bookMeta: {
    flex: 1,
    gap: 6,
  },
  bookFor: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  bookTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  bookPageCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  previewBox: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  previewLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1,
  },
  previewText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 23,
  },
  questionBox: {
    borderRadius: 22,
    padding: 16,
  },
  questionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  questionText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 23,
  },
  openButton: {
    minHeight: 56,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  openButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  storyActions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  emptyStory: {
    marginTop: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 28,
    padding: 34,
    alignItems: "center",
    gap: 10,
  },
  emptyStoryText: {
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 22,
  },
});
