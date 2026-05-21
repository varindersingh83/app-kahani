import { Feather } from "@expo/vector-icons";
import {
  getGeneratedStory,
  getStoryStatus,
  useGenerateStory,
  type GeneratedStory,
  type StoryGenerationJob,
  type StoryPlanningResponse,
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
  StoryCard,
  ThemeToggle,
  cardShadow,
  serifFamily,
} from "@/components/KahaniDesign";
import tokens from "@/constants/colors";
import { useStoryStudio, type Character } from "@/context/StoryContext";
import { useKahaniTheme } from "@/context/ThemeContext";

const BEHAVIOR_PROMPT_PLACEHOLDER =
  "What should the story help with?";

function isChildCharacter(character: Character) {
  return (
    (character.relationship ?? "child") === "child" &&
    !/^(mom|mum|mama|mother|dad|dada|papa|father)$/i.test(character.name.trim())
  );
}

export default function StudioScreen() {
  const { colors } = useKahaniTheme();
  const {
    characters,
    selectedCharacter,
    selectCharacter,
    currentStory,
    createGeneratedStory,
  } = useStoryStudio();
  const [prompt, setPrompt] = useState("");
  const [isPromptFocused, setIsPromptFocused] = useState(false);
  const [generationMessage, setGenerationMessage] = useState("");
  const [hasExternalTextAiConsent, setHasExternalTextAiConsent] =
    useState(false);
  const promptPlaceholderColor =
    colors.scheme === "dark"
      ? "rgba(188, 167, 134, 0.48)"
      : "rgba(129, 113, 94, 0.48)";
  const promptPlaceholder = BEHAVIOR_PROMPT_PLACEHOLDER;

  const mutation = useGenerateStory();

  const childCharacters = characters.filter(isChildCharacter);
  const selectedStoryCharacter =
    selectedCharacter && isChildCharacter(selectedCharacter)
      ? selectedCharacter
      : (childCharacters[0] ?? null);
  const supportingCharacters = characters
    .filter(
      (character) =>
        character.id !== selectedStoryCharacter?.id &&
        !isChildCharacter(character),
    )
    .map((character) => ({
      name: character.name,
      relationship: character.relationship ?? "parent",
    }));

  const generate = async () => {
    if (!selectedStoryCharacter) {
      Alert.alert(
        "Add a character",
        "Create a child character before generating a story.",
      );
      router.push("/(tabs)/characters");
      return;
    }

    const submittedText = prompt.trim();
    if (!submittedText) return;

    try {
      const storyPrompt = submittedText;
      setGenerationMessage("Reading the behavior...");
      const response = await submitStoryGeneration({
        consent: hasExternalTextAiConsent,
        prompt: storyPrompt,
      });

      if (isPlanningResponse(response)) {
        throw new Error(
          response.message ||
            "The story service needs a clearer prompt before generating.",
        );
      }

      await completeGeneratedJob(response);
    } catch (error) {
      if (isConsentRequiredError(error)) {
        const consented = await ensureExternalTextAiConsent(false);
        if (!consented) {
          setGenerationMessage("");
          return;
        }
        setHasExternalTextAiConsent(true);
        try {
          setGenerationMessage("Starting your book...");
          const retryResponse = await submitStoryGeneration({
            consent: true,
            prompt: prompt.trim(),
          });
          if (isPlanningResponse(retryResponse)) {
            throw new Error(
              retryResponse.message ||
                "The story service needs a clearer prompt before generating.",
            );
          }
          await completeGeneratedJob(retryResponse);
          return;
        } catch (retryError) {
          handleGenerationError(retryError);
          return;
        }
      }

      handleGenerationError(error);
    }
  };

  const submitStoryGeneration = async ({
    consent,
    prompt: storyPrompt,
  }: {
    consent: boolean;
    prompt: string;
  }) =>
    mutation.mutateAsync({
      data: {
        mode: "behavior",
        prompt: storyPrompt || undefined,
        character: {
          name: selectedStoryCharacter.name,
          appearance:
            selectedStoryCharacter.appearance ??
            "Use only the parent-entered appearance description; do not infer gender from the child's name.",
        },
        externalTextAiConsent: consent || undefined,
        supportingCharacters:
          supportingCharacters.length > 0 ? supportingCharacters : undefined,
      },
    });

  const completeGeneratedJob = async (job: StoryGenerationJob) => {
    setGenerationMessage("Starting your book...");
    const story = await waitForGeneratedStory(job.bookId, setGenerationMessage);
    const generatedStory = await createGeneratedStory({
      title: story.title,
      pages: story.pages,
      reflectionQuestion: story.reflectionQuestion,
      coverImageUrl: story.coverImageUrl ?? undefined,
      endImageUrl: story.endImageUrl ?? undefined,
      sheetImageUrl: story.sheetImageUrl ?? undefined,
      behaviorFocus: story.behaviorFocus ?? job.behaviorFocus,
      parentNote: story.parentNote ?? job.parentNote,
      classification: story.classification ?? job.classification,
      artifactLinks: story.artifactLinks,
      characterName: selectedStoryCharacter.name,
      characterPhotoUri:
        selectedStoryCharacter.characterImageSource === "generated-cartoon"
          ? selectedStoryCharacter.characterImageUri
          : undefined,
    });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPrompt("");
    setGenerationMessage("");
    router.push({
      pathname: "/book-reader",
      params: { storyId: generatedStory.id },
    });
  };

  const handleGenerationError = (error: unknown) => {
    setGenerationMessage("");
    const message =
      error instanceof Error
        ? error.message
        : "The story service could not finish. Try again in a moment.";
    Alert.alert("Story not ready", message);
  };

  const isGenerating = mutation.isPending || Boolean(generationMessage);

  return (
    <KahaniScreen withLeaves={false}>
      <View style={styles.topControls}>
        <ThemeToggle />
      </View>

      <SectionTitle>Choose a character</SectionTitle>
      <View style={styles.characterRow}>
        {childCharacters.map((character) => (
          <CharacterAvatar
            key={character.id}
            label={character.name}
            imageUri={character.characterImageUri}
            selected={character.id === selectedStoryCharacter?.id}
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

      <View
        style={[
          styles.promptPanel,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(colors.shadow),
        ]}
      >
        <View style={styles.composer}>
          {!prompt && !isPromptFocused ? (
            <Text
              pointerEvents="none"
              style={[
                styles.promptPlaceholder,
                { color: promptPlaceholderColor },
              ]}
            >
              {promptPlaceholder}
            </Text>
          ) : null}
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            multiline
            onFocus={() => setIsPromptFocused(true)}
            onBlur={() => setIsPromptFocused(false)}
            style={[
              styles.promptInput,
              { color: colors.foreground, outlineColor: "transparent" },
            ]}
            testID="story-prompt-input"
          />
        </View>
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
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.cardSectionTitle, { color: colors.foreground }]}>
          Created books
        </Text>
        {currentStory ? (
          <Text style={[styles.viewAll, { color: colors.bark }]}>View all</Text>
        ) : null}
      </View>

      {currentStory ? (
        <StoryCard
          featured
          title={currentStory.title}
          description={currentStory.pages[0]?.text}
          imageUri={
            currentStory.coverImageUrl ?? currentStory.characterPhotoUri
          }
          pages={currentStory.pages.length}
          onPress={() => router.push("/book-reader")}
          testID="newly-created-story-card"
        />
      ) : (
        <View
          style={[
            styles.emptyBooks,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}
          >
            <Feather name="book-open" color={colors.primary} size={24} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No books yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Generate a book and it will appear here, ready to open and save to
            your library.
          </Text>
        </View>
      )}
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
  promptPanel: {
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  composer: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    position: "relative",
  },
  promptPlaceholder: {
    position: "absolute",
    left: 14,
    top: 10,
    fontFamily: tokens.typography.sansMedium,
    fontSize: 16,
    lineHeight: 23,
  },
  promptInput: {
    minHeight: 126,
    maxHeight: 180,
    fontFamily: tokens.typography.sansMedium,
    fontSize: 16,
    lineHeight: 23,
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
  emptyBooks: {
    borderWidth: 1,
    borderRadius: 24,
    minHeight: 190,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: serifFamily(),
    fontSize: 30,
    lineHeight: 36,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: tokens.typography.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
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

function ensureExternalTextAiConsent(alreadyConsented: boolean) {
  if (alreadyConsented) return Promise.resolve(true);

  const message =
    "Kahani sends your story prompt and behavior details to an external AI text provider to generate the book. Family photos are not sent. Do you consent to continue?";

  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(message));
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert("AI text processing", message, [
      { text: "Not now", style: "cancel", onPress: () => resolve(false) },
      { text: "I consent", onPress: () => resolve(true) },
    ]);
  });
}

function isPlanningResponse(
  response: StoryGenerationJob | StoryPlanningResponse,
): response is StoryPlanningResponse {
  return response.status === "needs_clarification";
}

function isConsentRequiredError(error: unknown) {
  const candidate = error as {
    status?: number;
    data?: { code?: string };
    message?: string;
  };
  return (
    candidate?.status === 403 ||
    candidate?.data?.code === "external_text_ai_consent_required" ||
    /external text ai consent/i.test(candidate?.message ?? "")
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
