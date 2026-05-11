import { Feather } from "@expo/vector-icons";
import { GeneratedStory, useGenerateStory } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  CharacterAvatar,
  KahaniButton,
  KahaniScreen,
  SectionTitle,
  SegmentedControl,
  StoryCard,
  ThemeToggle,
  cardShadow,
  serifFamily,
} from "@/components/KahaniDesign";
import tokens from "@/constants/colors";
import { useStoryStudio } from "@/context/StoryContext";
import { useKahaniTheme } from "@/context/ThemeContext";

type StoryMode = "behavior" | "random";

const SAMPLE_TITLE = "The Little Seed's Journey";
const SAMPLE_TEXT =
  "A tiny seed dreams big and learns that growth takes time, love and little by little.";

export default function StudioScreen() {
  const { colors } = useKahaniTheme();
  const {
    characters,
    selectedCharacter,
    selectedCharacterId,
    selectCharacter,
    currentStory,
    setGeneratedStory,
  } = useStoryStudio();
  const [mode, setMode] = useState<StoryMode>("behavior");
  const [prompt, setPrompt] = useState("");

  const mutation = useGenerateStory({
    mutation: {
      onSuccess: (story: GeneratedStory) => {
        setGeneratedStory({
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
        Alert.alert(
          "Story not ready",
          "The story service could not finish. Try again in a moment.",
        );
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

  const storyTitle = currentStory?.title ?? SAMPLE_TITLE;
  const storyText = currentStory?.pages[0]?.text ?? SAMPLE_TEXT;
  const visibleCharacters = characters.slice(0, 3);

  return (
    <KahaniScreen withLeaves={false}>
      <View style={styles.topControls}>
        <ThemeToggle />
      </View>

      <SectionTitle>Choose a character</SectionTitle>
      <View style={styles.characterRow}>
        {visibleCharacters.map((character) => (
          <CharacterAvatar
            key={character.id}
            label={character.name}
            imageUri={character.photoUri}
            selected={character.id === selectedCharacterId}
            onPress={() => selectCharacter(character.id)}
          />
        ))}
        <CharacterAvatar
          key="add-character"
          label="Add child"
          icon="plus"
          muted
          onPress={() => router.push("/(tabs)/characters")}
        />
      </View>

      <SectionTitle>Story type</SectionTitle>
      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { value: "behavior", label: "Behavior support" },
          { value: "random", label: "Random story" },
        ]}
      />

      <View
        style={[
          styles.promptBox,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          cardShadow(colors.shadow),
        ]}
      >
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          multiline
          placeholder={
            mode === "behavior"
              ? "sharing toys, bedtime resistance, using gentle hands"
              : "Optional idea, theme, animal, or place"
          }
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.promptInput,
            { color: colors.foreground, outlineColor: "transparent" },
          ]}
        />
      </View>

      <View style={styles.ctaBlock}>
        <KahaniButton
          label={mutation.isPending ? "Writing your story..." : "Generate book"}
          icon="zap"
          onPress={generate}
          disabled={mutation.isPending}
        />
        {mutation.isPending ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.cardSectionTitle, { color: colors.foreground }]}>
          Newly created
        </Text>
        <Text style={[styles.viewAll, { color: colors.bark }]}>View all</Text>
      </View>
      <StoryCard
        featured
        title={storyTitle}
        description={storyText}
        imageUri={currentStory?.coverImageUrl ?? currentStory?.characterPhotoUri}
        pages={currentStory?.pages.length ?? 24}
        onPress={() => {
          if (currentStory) {
            router.push("/book-reader");
          }
        }}
      />

      {!currentStory ? (
        <View style={styles.hintRow}>
          <Feather name="info" color={colors.leaf} size={16} />
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            Generate a story to replace this sample card with your child's book.
          </Text>
        </View>
      ) : null}
    </KahaniScreen>
  );
}

const styles = StyleSheet.create({
  topControls: {
    alignItems: "flex-end",
    marginBottom: 22,
  },
  characterRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  promptBox: {
    minHeight: 128,
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  promptInput: {
    minHeight: 96,
    fontFamily: tokens.typography.sansMedium,
    fontSize: 17,
    lineHeight: 25,
    textAlignVertical: "top",
  },
  ctaBlock: {
    marginBottom: 2,
  },
  loader: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 52,
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontFamily: serifFamily(),
    fontSize: 28,
  },
  viewAll: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 14,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  hintText: {
    flex: 1,
    fontFamily: tokens.typography.sansMedium,
    fontSize: 13,
    lineHeight: 19,
  },
});
