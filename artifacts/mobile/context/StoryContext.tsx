import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  sanitizeCharacterForStorage,
  sanitizeCharactersForStorage,
  type AppearanceSource,
  type CharacterImageSource,
} from "@/services/characterPrivacy";

export type StoryPage = {
  pageNumber: number;
  text: string;
  illustrationPrompt: string;
  imageUrl?: string;
  scene?: string;
  composition?: string;
  emotion?: string;
};

export type BehaviorClassificationSummary = {
  categoryId: string;
  scene: string;
  visibleBehavior: string;
  mechanism: string;
  strategy: string;
  childStorySkill: string;
  parentGuidance: string;
  targetOutcome: string;
  storyFocusLabel: string;
};

export type Character = {
  id: string;
  name: string;
  photoUri?: string;
  relationship?: CharacterRelationship;
  appearance?: string;
  appearanceSource?: AppearanceSource;
  characterImageUri?: string;
  characterImageSource?: CharacterImageSource;
};

export type CharacterRelationship = "child" | "mom" | "dad";

export type Story = {
  id: string;
  title: string;
  pages: StoryPage[];
  reflectionQuestion: string;
  coverImageUrl?: string;
  endImageUrl?: string;
  sheetImageUrl?: string;
  behaviorFocus?: BehaviorClassificationSummary;
  parentNote?: string;
  classification?: BehaviorClassificationSummary;
  artifactLinks?: {
    bookHtmlUrl?: string;
    storyJsonUrl?: string;
    usageJsonUrl?: string;
  };
  characterName: string;
  characterPhotoUri?: string;
  createdAt: string;
};

type StoryContextValue = {
  characters: Character[];
  savedStories: Story[];
  selectedCharacterId: string | null;
  currentStory: Story | null;
  selectedCharacter: Character | null;
  addCharacter: (
    name: string,
    photoUri?: string,
    relationship?: CharacterRelationship,
    appearance?: string,
    appearanceSource?: AppearanceSource,
    characterImageUri?: string,
    characterImageSource?: CharacterImageSource,
  ) => Promise<void>;
  removeCharacter: (id: string) => Promise<void>;
  selectCharacter: (id: string) => Promise<void>;
  setGeneratedStory: (story: Omit<Story, "id" | "createdAt">) => void;
  createGeneratedStory: (
    story: Omit<Story, "id" | "createdAt">,
  ) => Promise<Story>;
  openStory: (story: Story) => void;
  openStoryById: (id: string) => Story | null;
  saveCurrentStory: () => Promise<void>;
  removeStory: (id: string) => Promise<void>;
};

const STORAGE_KEY_PREFIX = "parent-story-studio";
const DEV_LIBRARY_SEED_URL =
  process.env.EXPO_PUBLIC_DEV_LIBRARY_SEED_URL ??
  "/api/story-runs/ui-emma-liam-20260520/mobile-library-seed.json";
const StoryContext = createContext<StoryContextValue | null>(null);

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getDevProfileId() {
  if (typeof window === "undefined") return "local_profile";
  if (!window.location?.href) return "local_profile";

  const url = new URL(window.location.href);
  const storage =
    typeof window.localStorage === "undefined" ? null : window.localStorage;
  const profileId =
    url.searchParams.get("profile") ?? url.searchParams.get("devProfileId");
  if (profileId) {
    storage?.setItem("kahani-active-profile-id", profileId);
    return profileId;
  }

  return storage?.getItem("kahani-active-profile-id") ?? "local_profile";
}

function isParentLikeName(name: string) {
  return /^(mom|mum|mama|mother|dad|dada|papa|father)$/i.test(name.trim());
}

function isChildCharacter(character: Pick<Character, "name" | "relationship">) {
  return (
    (character.relationship ?? "child") === "child" &&
    !isParentLikeName(character.name)
  );
}

function absolutizeStoryUrls(story: Story): Story {
  return {
    ...story,
    coverImageUrl: absolutizeUrl(story.coverImageUrl),
    endImageUrl: absolutizeUrl(story.endImageUrl),
    sheetImageUrl: absolutizeUrl(story.sheetImageUrl),
    characterPhotoUri: absolutizeUrl(story.characterPhotoUri),
    artifactLinks: story.artifactLinks
      ? {
          bookHtmlUrl: absolutizeUrl(story.artifactLinks.bookHtmlUrl),
          storyJsonUrl: absolutizeUrl(story.artifactLinks.storyJsonUrl),
          usageJsonUrl: absolutizeUrl(story.artifactLinks.usageJsonUrl),
        }
      : undefined,
    pages: story.pages.map((page) => ({
      ...page,
      imageUrl: absolutizeUrl(page.imageUrl),
    })),
  };
}

function absolutizeCharacterUrls(character: Character): Character {
  return {
    ...character,
    characterImageUri: absolutizeUrl(character.characterImageUri),
  };
}

function absolutizeUrl(url?: string) {
  if (!url) return undefined;
  if (
    /^https?:\/\//i.test(url) ||
    url.startsWith("file:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const baseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (typeof window !== "undefined" ? window.location.origin : undefined);
  if (!baseUrl) return url;

  return new URL(url, baseUrl).toString();
}

export function StoryProvider({
  children,
  profileId,
}: {
  children: React.ReactNode;
  profileId?: string | null;
}) {
  const activeProfileId = profileId ?? getDevProfileId();
  const storageKey = `${STORAGE_KEY_PREFIX}:${activeProfileId}`;
  const [characters, setCharacters] = useState<Character[]>([]);
  const [savedStories, setSavedStories] = useState<Story[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((raw) => {
      const saved = raw
        ? (JSON.parse(raw) as {
            characters?: Character[];
            savedStories?: Story[];
            selectedCharacterId?: string | null;
          })
        : {};
      const nextCharacters = sanitizeCharactersForStorage(
        saved.characters ?? [],
      ) as Character[];
      const nextSavedStories = saved.savedStories ?? [];
      const nextSelectedCharacterId = saved.selectedCharacterId ?? null;

      setCharacters(nextCharacters);
      setSavedStories(nextSavedStories);
      setSelectedCharacterId(nextSelectedCharacterId);
      setCurrentStory(null);
      void AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          characters: nextCharacters,
          savedStories: nextSavedStories,
          selectedCharacterId: nextSelectedCharacterId,
        }),
      );

      if (process.env.NODE_ENV !== "production") {
        void seedStoryFromUrl({
          characters: nextCharacters,
          savedStories: nextSavedStories,
          setCharacters,
          setSavedStories,
          setCurrentStory,
          setSelectedCharacterId,
          storageKey,
        });
        void seedDevLibraryBatch({
          characters: nextCharacters,
          savedStories: nextSavedStories,
          selectedCharacterId: nextSelectedCharacterId,
          setCharacters,
          setSavedStories,
          setCurrentStory,
          setSelectedCharacterId,
          storageKey,
        });
      }
    });
  }, [storageKey]);

  async function seedStoryFromUrl(input: {
    characters: Character[];
    savedStories: Story[];
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
    setSavedStories: React.Dispatch<React.SetStateAction<Story[]>>;
    setCurrentStory: React.Dispatch<React.SetStateAction<Story | null>>;
    setSelectedCharacterId: React.Dispatch<React.SetStateAction<string | null>>;
    storageKey: string;
  }) {
    if (typeof window === "undefined") return;
    if (!window.location?.href) return;

    const url = new URL(window.location.href);
    const seedUrl = url.searchParams.get("devSeedStoryUrl");
    if (!seedUrl) return;

    const characterName =
      url.searchParams.get("devSeedCharacterName") ?? "Maya";
    const characterPhotoUri =
      url.searchParams.get("devSeedCharacterPhotoUri") ?? undefined;
    url.searchParams.delete("devSeedStoryUrl");
    url.searchParams.delete("devSeedCharacterName");
    url.searchParams.delete("devSeedCharacterPhotoUri");
    window.history?.replaceState?.({}, "", url.toString());

    const response = await fetch(seedUrl);
    if (!response.ok) return;

    const generated = (await response.json()) as Omit<
      Story,
      "id" | "characterName" | "characterPhotoUri" | "createdAt"
    >;
    const story: Story = {
      ...generated,
      id: createId(),
      characterName,
      characterPhotoUri,
      createdAt: new Date().toISOString(),
    };
    const character: Character = sanitizeCharacterForStorage({
      id: createId(),
      name: characterName,
      photoUri: characterPhotoUri,
    }) as Character;
    const nextCharacters = [character, ...input.characters];
    const nextStories = [story, ...input.savedStories];

    input.setCharacters(nextCharacters);
    input.setSavedStories(nextStories);
    input.setCurrentStory(story);
    input.setSelectedCharacterId(character.id);
    await AsyncStorage.setItem(
      input.storageKey,
      JSON.stringify({
        characters: sanitizeCharactersForStorage(nextCharacters) as Character[],
        savedStories: nextStories,
        selectedCharacterId: character.id,
      }),
    );
  }

  async function seedDevLibraryBatch(input: {
    characters: Character[];
    savedStories: Story[];
    selectedCharacterId: string | null;
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
    setSavedStories: React.Dispatch<React.SetStateAction<Story[]>>;
    setCurrentStory: React.Dispatch<React.SetStateAction<Story | null>>;
    setSelectedCharacterId: React.Dispatch<React.SetStateAction<string | null>>;
    storageKey: string;
  }) {
    const seedUrl = absolutizeUrl(DEV_LIBRARY_SEED_URL);
    if (!seedUrl) return;

    const response = await fetch(seedUrl).catch(() => null);
    if (!response?.ok) return;

    const seed = (await response.json()) as {
      characters?: Character[];
      stories?: Story[];
    };
    const seededCharacters = (seed.characters ?? []).map(
      absolutizeCharacterUrls,
    );
    const seededStories = (seed.stories ?? []).map(absolutizeStoryUrls);
    if (seededCharacters.length === 0 && seededStories.length === 0) return;

    const charactersByName = new Map(
      input.characters.map((character) => [
        character.name.trim().toLowerCase(),
        character,
      ]),
    );
    const nextCharacters = [...input.characters];
    for (const seededCharacter of seededCharacters) {
      const nameKey = seededCharacter.name.trim().toLowerCase();
      const existingCharacter = charactersByName.get(nameKey);
      if (existingCharacter) {
        Object.assign(existingCharacter, seededCharacter, {
          id: existingCharacter.id,
        });
      } else {
        nextCharacters.unshift(seededCharacter);
        charactersByName.set(nameKey, seededCharacter);
      }
    }

    const existingStoryIds = new Set(
      input.savedStories.map((story) => story.id),
    );
    const nextSeededStories = seededStories.filter(
      (story) => !existingStoryIds.has(story.id),
    );
    if (nextSeededStories.length === 0 && seededCharacters.length === 0) return;

    const nextStories = [...nextSeededStories, ...input.savedStories];
    const nextSelectedCharacterId =
      input.selectedCharacterId ??
      nextCharacters.find((character) => character.name === "Emma")?.id ??
      nextCharacters.find(isChildCharacter)?.id ??
      null;

    input.setCharacters(nextCharacters);
    input.setSavedStories(nextStories);
    input.setCurrentStory(
      nextSeededStories[0] ?? input.savedStories[0] ?? null,
    );
    input.setSelectedCharacterId(nextSelectedCharacterId);

    await AsyncStorage.setItem(
      input.storageKey,
      JSON.stringify({
        characters: sanitizeCharactersForStorage(nextCharacters) as Character[],
        savedStories: nextStories,
        selectedCharacterId: nextSelectedCharacterId,
      }),
    );
  }

  const persist = useCallback(
    async (next?: {
      characters?: Character[];
      savedStories?: Story[];
      selectedCharacterId?: string | null;
    }) => {
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          characters: sanitizeCharactersForStorage(
            next?.characters ?? characters,
          ) as Character[],
          savedStories: next?.savedStories ?? savedStories,
          selectedCharacterId: next?.selectedCharacterId ?? selectedCharacterId,
        }),
      );
    },
    [characters, savedStories, selectedCharacterId, storageKey],
  );

  const addCharacter = useCallback(
    async (
      name: string,
      photoUri?: string,
      relationship?: CharacterRelationship,
      appearance?: string,
      appearanceSource?: AppearanceSource,
      characterImageUri?: string,
      characterImageSource?: CharacterImageSource,
    ) => {
      const character = sanitizeCharacterForStorage({
        id: createId(),
        name: name.trim(),
        photoUri,
        relationship: relationship ?? "child",
        appearance: appearance?.trim() || undefined,
        appearanceSource,
        characterImageUri,
        characterImageSource,
      }) as Character;
      const nextCharacters = [character, ...characters];
      const nextSelectedCharacterId =
        !selectedCharacterId || isChildCharacter(character)
          ? character.id
          : selectedCharacterId;
      setCharacters(nextCharacters);
      setSelectedCharacterId(nextSelectedCharacterId);
      await persist({
        characters: nextCharacters,
        selectedCharacterId: nextSelectedCharacterId,
      });
    },
    [characters, persist, selectedCharacterId],
  );

  const removeCharacter = useCallback(
    async (id: string) => {
      const nextCharacters = characters.filter(
        (character) => character.id !== id,
      );
      const nextSelected =
        selectedCharacterId === id
          ? (nextCharacters[0]?.id ?? null)
          : selectedCharacterId;
      setCharacters(nextCharacters);
      setSelectedCharacterId(nextSelected);
      await persist({
        characters: nextCharacters,
        selectedCharacterId: nextSelected,
      });
    },
    [characters, persist, selectedCharacterId],
  );

  const selectCharacter = useCallback(
    async (id: string) => {
      setSelectedCharacterId(id);
      await persist({ selectedCharacterId: id });
    },
    [persist],
  );

  const setGeneratedStory = useCallback(
    (story: Omit<Story, "id" | "createdAt">) => {
      setCurrentStory({
        ...story,
        id: createId(),
        createdAt: new Date().toISOString(),
      });
    },
    [],
  );

  const createGeneratedStory = useCallback(
    async (story: Omit<Story, "id" | "createdAt">) => {
      const generatedStory: Story = {
        ...story,
        id: createId(),
        createdAt: new Date().toISOString(),
      };
      const nextStories = [generatedStory, ...savedStories];
      setCurrentStory(generatedStory);
      setSavedStories(nextStories);
      await persist({ savedStories: nextStories });
      return generatedStory;
    },
    [persist, savedStories],
  );

  const openStory = useCallback((story: Story) => {
    setCurrentStory(story);
  }, []);

  const openStoryById = useCallback(
    (id: string) => {
      const story =
        savedStories.find((savedStory) => savedStory.id === id) ?? null;
      if (story) {
        setCurrentStory(story);
      }
      return story;
    },
    [savedStories],
  );

  const saveCurrentStory = useCallback(async () => {
    if (!currentStory) return;
    const exists = savedStories.some((story) => story.id === currentStory.id);
    const nextStories = exists ? savedStories : [currentStory, ...savedStories];
    setSavedStories(nextStories);
    await persist({ savedStories: nextStories });
  }, [currentStory, persist, savedStories]);

  const removeStory = useCallback(
    async (id: string) => {
      const nextStories = savedStories.filter((story) => story.id !== id);
      if (currentStory?.id === id) {
        setCurrentStory(null);
      }
      setSavedStories(nextStories);
      await persist({ savedStories: nextStories });
    },
    [currentStory, persist, savedStories],
  );

  const selectedCharacter = useMemo(
    () =>
      characters.find((character) => character.id === selectedCharacterId) ??
      null,
    [characters, selectedCharacterId],
  );

  const value = useMemo(
    () => ({
      characters,
      savedStories,
      selectedCharacterId,
      currentStory,
      selectedCharacter,
      addCharacter,
      removeCharacter,
      selectCharacter,
      setGeneratedStory,
      createGeneratedStory,
      openStory,
      openStoryById,
      saveCurrentStory,
      removeStory,
    }),
    [
      addCharacter,
      characters,
      createGeneratedStory,
      currentStory,
      openStory,
      openStoryById,
      removeCharacter,
      removeStory,
      saveCurrentStory,
      savedStories,
      selectCharacter,
      selectedCharacter,
      selectedCharacterId,
      setGeneratedStory,
    ],
  );

  return (
    <StoryContext.Provider value={value}>{children}</StoryContext.Provider>
  );
}

export function useStoryStudio() {
  const value = useContext(StoryContext);
  if (!value) {
    throw new Error("useStoryStudio must be used inside StoryProvider.");
  }
  return value;
}
