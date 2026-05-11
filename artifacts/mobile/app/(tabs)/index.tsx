import { Feather } from "@expo/vector-icons";
import { useGenerateStory } from "@workspace/api-client-react";
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
  KahaniHeader,
  KahaniScreen,
  SectionTitle,
  SegmentedControl,
  StoryCard,
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
  const [prompt, setPrompt] = useState(
    "sharing toys, bedtime resistance,\nusing gentle hands",
  );

  const mutation = useGenerateStory({
    mutation: {
      onSuccess: (story) => {
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
  const characterName = selectedCharacter?.name ?? "Maya";

  return (
    <KahaniScreen>
      <KahaniHeader greeting="Good morning," title={characterName} />

      <SectionTitle>Choose a character</SectionTitle>
      <View style={styles.characterRow}>
        {[0, 1, 2, 3].map((slot) => {
          const character = characters[slot];
          if (character) {
            return (
              <CharacterAvatar
                key={character.id}
                label={character.name}
                imageUri={character.photoUri}
                selected={character.id === selectedCharacterId}
                onPress={() => selectCharacter(character.id)}
              />
            );
          }
          if (slot === characters.length) {
            return (
              <CharacterAvatar
                key="add-character"
                label="Add"
                icon="plus"
                onPress={() => router.push("/(tabs)/characters")}
              />
            );
          }
          return <CharacterAvatar key={`empty-${slot}`} label=".." icon="more-horizontal" />;
        })}
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
          style={[styles.promptInput, { color: colors.foreground }]}
        />
      </View>

      <KahaniButton
        label={mutation.isPending ? "Writing your story..." : "Generate picture book"}
        icon="zap"
        onPress={generate}
        disabled={mutation.isPending}
      />
      {mutation.isPending ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : null}

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
  characterRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  promptBox: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 24,
    marginTop: 18,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  promptInput: {
    minHeight: 76,
    fontFamily: tokens.typography.sansMedium,
    fontSize: 19,
    lineHeight: 29,
    textAlignVertical: "top",
  },
  loader: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
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
