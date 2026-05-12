import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type StoryPage = {
  pageNumber: number;
  text: string;
  illustrationPrompt: string;
  imageUrl?: string;
  scene?: string;
  composition?: string;
  emotion?: string;
};

export type Character = {
  id: string;
  name: string;
  photoUri?: string;
};

export type Story = {
  id: string;
  title: string;
  pages: StoryPage[];
  reflectionQuestion: string;
  coverImageUrl?: string;
  endImageUrl?: string;
  sheetImageUrl?: string;
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
  addCharacter: (name: string, photoUri?: string) => Promise<void>;
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
const StoryContext = createContext<StoryContextValue | null>(null);

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getDevProfileId() {
  if (typeof window === "undefined") return "local_profile";

  const url = new URL(window.location.href);
  const profileId =
    url.searchParams.get("profile") ?? url.searchParams.get("devProfileId");
  if (profileId) {
    window.localStorage.setItem("kahani-active-profile-id", profileId);
    return profileId;
  }

  return (
    window.localStorage.getItem("kahani-active-profile-id") ?? "local_profile"
  );
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
      const nextCharacters = saved.characters ?? [];
      const nextSavedStories = saved.savedStories ?? [];
      const nextSelectedCharacterId = saved.selectedCharacterId ?? null;

      setCharacters(nextCharacters);
      setSavedStories(nextSavedStories);
      setSelectedCharacterId(nextSelectedCharacterId);
      setCurrentStory(null);

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
      }
    });
  }, [storageKey]);

  async function seedStoryFromUrl(input: {
    characters: Character[];
    savedStories: Story[];
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
    setSavedStories: React.Dispatch<React.SetStateAction<Story[]>>;
    setCurrentStory: React.Dispatch<React.SetStateAction<Story | null>>;
    setSelectedCharacterId: React.Dispatch<
      React.SetStateAction<string | null>
    >;
    storageKey: string;
  }) {
    if (typeof window === "undefined") return;

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
    window.history.replaceState({}, "", url.toString());

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
    const character: Character = {
      id: createId(),
      name: characterName,
      photoUri: characterPhotoUri,
    };
    const nextCharacters = [character, ...input.characters];
    const nextStories = [story, ...input.savedStories];

    input.setCharacters(nextCharacters);
    input.setSavedStories(nextStories);
    input.setCurrentStory(story);
    input.setSelectedCharacterId(character.id);
    await AsyncStorage.setItem(
      input.storageKey,
      JSON.stringify({
        characters: nextCharacters,
        savedStories: nextStories,
        selectedCharacterId: character.id,
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
          characters: next?.characters ?? characters,
          savedStories: next?.savedStories ?? savedStories,
          selectedCharacterId: next?.selectedCharacterId ?? selectedCharacterId,
        }),
      );
    },
    [characters, savedStories, selectedCharacterId, storageKey],
  );

  const addCharacter = useCallback(
    async (name: string, photoUri?: string) => {
      const character = { id: createId(), name: name.trim(), photoUri };
      const nextCharacters = [character, ...characters];
      setCharacters(nextCharacters);
      setSelectedCharacterId(character.id);
      await persist({
        characters: nextCharacters,
        selectedCharacterId: character.id,
      });
    },
    [characters, persist],
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
      setSavedStories(nextStories);
      await persist({ savedStories: nextStories });
    },
    [persist, savedStories],
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
