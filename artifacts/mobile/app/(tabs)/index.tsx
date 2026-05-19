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
  StoryCard,
  ThemeToggle,
  cardShadow,
  serifFamily,
} from "@/components/KahaniDesign";
import tokens from "@/constants/colors";
import { useStoryStudio } from "@/context/StoryContext";
import { useKahaniTheme } from "@/context/ThemeContext";

const BEHAVIOR_PROMPT_PLACEHOLDER =
  "sharing toys, bedtime resistance, using gentle hands";

function isParentCharacterName(name: string) {
  return /^(mom|mum|mama|mother|dad|dada|papa|father)$/i.test(name.trim());
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
  const [issueNotice, setIssueNotice] = useState<string | null>(null);
  const [hasExternalTextAiConsent, setHasExternalTextAiConsent] =
    useState(false);
  const promptPlaceholderColor =
    colors.scheme === "dark"
      ? "rgba(188, 167, 134, 0.48)"
      : "rgba(129, 113, 94, 0.48)";

  const mutation = useGenerateStory({
    mutation: {
      onError: () => {
        Alert.alert(
          "Story not ready",
          "The story service could not finish. Try again in a moment.",
        );
      },
    },
  });

  const childCharacters = characters.filter(
    (character) => !isParentCharacterName(character.name),
  );
  const selectedStoryCharacter =
    selectedCharacter && !isParentCharacterName(selectedCharacter.name)
      ? selectedCharacter
      : (childCharacters[0] ?? selectedCharacter);
  const parentCharacter = characters.find(
    (character) =>
      character.id !== selectedStoryCharacter?.id &&
      isParentCharacterName(character.name),
  );

  const generate = async () => {
    if (!selectedStoryCharacter) {
      Alert.alert(
        "Add a character",
        "Create a character before generating a story.",
      );
      router.push("/(tabs)/characters");
      return;
    }

    const consented = await ensureExternalTextAiConsent(
      hasExternalTextAiConsent,
    );
    if (!consented) return;
    if (!hasExternalTextAiConsent) {
      setHasExternalTextAiConsent(true);
    }

    try {
      const storyPrompt = prompt.trim() || undefined;
      setIssueNotice(null);
      setGenerationMessage("Starting your book...");
      const job = await mutation.mutateAsync({
        data: {
          mode: "behavior",
          prompt: storyPrompt,
          character: {
            name: selectedStoryCharacter.name,
            appearance:
              selectedStoryCharacter.appearance ??
              "Use only the parent-entered appearance description; do not infer gender from the child's name.",
          },
          externalTextAiConsent: true,
          supportingCharacters: parentCharacter
            ? [
                {
                  name: parentCharacter.name,
                  relationship: "parent",
                  appearance: parentCharacter.appearance,
                },
              ]
            : undefined,
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
        characterName: selectedStoryCharacter.name,
        characterPhotoUri: selectedStoryCharacter.photoUri ?? undefined,
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setPrompt("");
      setIsPromptFocused(false);
      setGenerationMessage("");
      router.push({
        pathname: "/book-reader",
        params: { storyId: generatedStory.id },
      });
    } catch (error) {
      setGenerationMessage("");
      Alert.alert(
        "Story not ready",
        error instanceof Error
          ? error.message
          : "The story service could not finish. Try again in a moment.",
      );
    }
  };

  const visibleCharacters = characters;
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
            selected={character.id === selectedStoryCharacter?.id}
            onPress={() => selectCharacter(character.id)}
          />
        ))}
        <CharacterAvatar
          key="add-character"
          label="Add character"
          icon="plus"
          muted
          onPress={() => router.push("/(tabs)/characters")}
        />
      </View>

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
          onBlur={() => setIsPromptFocused(false)}
          onFocus={() => setIsPromptFocused(true)}
          placeholder={isPromptFocused ? "" : BEHAVIOR_PROMPT_PLACEHOLDER}
          placeholderTextColor={promptPlaceholderColor}
          style={[
            styles.promptInput,
            { color: colors.foreground, outlineColor: "transparent" },
          ]}
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
        />
        {isGenerating ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : null}
        {issueNotice ? (
          <Text style={[styles.issueNotice, { color: colors.mutedForeground }]}>
            {issueNotice}
          </Text>
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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
