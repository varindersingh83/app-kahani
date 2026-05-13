import { Feather } from "@expo/vector-icons";
import {
  getGeneratedStory,
  getStoryStatus,
  useGenerateStory,
  type GeneratedStory,
} from "@workspace/api-client-react";
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
    selectedCharacterId,
    selectCharacter,
    currentStory,
    createGeneratedStory,
  } = useStoryStudio();
  const [mode, setMode] = useState<StoryMode>("behavior");
  const [prompt, setPrompt] = useState("");
  const [generationMessage, setGenerationMessage] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [issueNotice, setIssueNotice] = useState<string | null>(null);
  const childCharacters = characters.filter(
    (character) => (character.relationship ?? "child") === "child",
  );
  const selectedChild =
    childCharacters.find((character) => character.id === selectedCharacterId) ??
    childCharacters[0] ??
    null;
  const supportingCharacters = characters
    .filter((character) => (character.relationship ?? "child") !== "child")
    .map((character) => ({
      name: character.name,
      relationship: character.relationship ?? "family",
    }));

  const mutation = useGenerateStory({
    mutation: {
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "The story service could not finish. Try again in a moment.";
        setGenerationError(message);
        Alert.alert(
          "Story not ready",
          message,
        );
      },
    },
  });

  const generate = async () => {
    if (!selectedChild) {
      Alert.alert(
        "Add a character",
        "Create a child character before generating a story.",
      );
      router.push("/(tabs)/characters");
      return;
    }

    try {
      const storyPrompt = prompt.trim() || undefined;
      setIssueNotice(null);
      setGenerationError(null);
      setGenerationMessage("Starting your book...");
      const job = await mutation.mutateAsync({
        data: {
          mode,
          prompt: storyPrompt,
          character: {
            name: selectedChild.name,
            photoUri: selectedChild.photoUri,
          },
          supportingCharacters,
        },
      });
      setIssueNotice(job.issueNotice ?? null);
      const story = await waitForGeneratedStory(
        job.bookId,
        setGenerationMessage,
      );
      const generatedStory = await createGeneratedStory({
        title: story.title,
        pages: story.pages,
        reflectionQuestion: story.reflectionQuestion,
        coverImageUrl: story.coverImageUrl ?? undefined,
        endImageUrl: story.endImageUrl ?? undefined,
        sheetImageUrl: story.sheetImageUrl ?? undefined,
        artifactLinks: story.artifactLinks,
        characterName: selectedChild.name,
        characterPhotoUri: selectedChild.photoUri ?? undefined,
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setGenerationMessage("");
      router.push({
        pathname: "/book-reader",
        params: { storyId: generatedStory.id },
      });
    } catch (error) {
      setGenerationMessage("");
      const message =
        error instanceof Error
          ? error.message
          : "The story service could not finish. Try again in a moment.";
      setGenerationError(message);
      Alert.alert(
        "Story not ready",
        message,
      );
    }
  };

  const storyTitle = currentStory?.title ?? SAMPLE_TITLE;
  const storyText = currentStory?.pages[0]?.text ?? SAMPLE_TEXT;
  const visibleCharacters = childCharacters.slice(0, 3);
  const isGenerating = mutation.isPending || Boolean(generationMessage);

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
            selected={character.id === selectedChild?.id}
            onPress={() => selectCharacter(character.id)}
            testID={`story-character-${character.name}`}
          />
        ))}
        <CharacterAvatar
          key="add-character"
          label="Add character"
          icon="plus"
          muted
          onPress={() => router.push("/(tabs)/characters")}
          testID="add-character-shortcut"
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
              : "picnic with parents, drive home from school, rainy day adventure"
          }
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.promptInput,
            { color: colors.foreground, outlineColor: "transparent" },
          ]}
          testID="story-prompt-input"
        />
      </View>

      <View style={styles.ctaBlock}>
        <KahaniButton
          label={
            isGenerating
              ? generationMessage || "Writing your story..."
              : "Generate book"
          }
          icon="zap"
          onPress={() => generate()}
          disabled={isGenerating}
          testID="generate-book-button"
        />
        {isGenerating ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : null}
        {issueNotice ? (
          <Text style={[styles.issueNotice, { color: colors.mutedForeground }]}>
            {issueNotice}
          </Text>
        ) : null}
        {generationError ? (
          <Text
            testID="generation-error"
            style={[styles.generationError, { color: colors.primary }]}
          >
            {generationError}
          </Text>
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
        imageUri={
          currentStory?.coverImageUrl ?? currentStory?.characterPhotoUri
        }
        pages={currentStory?.pages.length ?? 24}
        onPress={() => {
          if (currentStory) {
            router.push("/book-reader");
          }
        }}
        testID="newly-created-story-card"
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
  issueNotice: {
    marginTop: 12,
    fontFamily: tokens.typography.sansMedium,
    fontSize: 13,
    lineHeight: 19,
  },
  generationError: {
    marginTop: 12,
    fontFamily: tokens.typography.sansBold,
    fontSize: 14,
    lineHeight: 20,
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

async function waitForGeneratedStory(
  bookId: string,
  setMessage: (message: string) => void,
): Promise<GeneratedStory> {
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const status = await getStoryStatus(bookId);
    setMessage(status.message);

    if (status.status === "failed") {
      throw new Error(
        status.error ?? "The story service could not generate the book.",
      );
    }

    if (status.status === "complete") {
      setMessage("Opening your book...");
      return getGeneratedStory(bookId);
    }

    await delay(1500);
  }

  throw new Error(
    "The story is taking longer than expected. Please try again.",
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
