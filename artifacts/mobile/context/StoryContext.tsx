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
  createGeneratedStory: (story: Omit<Story, "id" | "createdAt">) => Promise<Story>;
  openStory: (story: Story) => void;
  openStoryById: (id: string) => Story | null;
  saveCurrentStory: () => Promise<void>;
  removeStory: (id: string) => Promise<void>;
};

const STORAGE_KEY = "parent-story-studio";
const StoryContext = createContext<StoryContextValue | null>(null);

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [savedStories, setSavedStories] = useState<Story[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        characters?: Character[];
        savedStories?: Story[];
        selectedCharacterId?: string | null;
      };
      setCharacters(saved.characters ?? []);
      setSavedStories(saved.savedStories ?? []);
      setSelectedCharacterId(saved.selectedCharacterId ?? null);
    });
  }, []);

  const persist = useCallback(
    async (next?: {
      characters?: Character[];
      savedStories?: Story[];
      selectedCharacterId?: string | null;
    }) => {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          characters: next?.characters ?? characters,
          savedStories: next?.savedStories ?? savedStories,
          selectedCharacterId: next?.selectedCharacterId ?? selectedCharacterId,
        }),
      );
    },
    [characters, savedStories, selectedCharacterId],
  );

  const addCharacter = useCallback(
    async (name: string, photoUri?: string) => {
      const character = { id: createId(), name: name.trim(), photoUri };
      const nextCharacters = [character, ...characters];
      setCharacters(nextCharacters);
      setSelectedCharacterId(character.id);
      await persist({ characters: nextCharacters, selectedCharacterId: character.id });
    },
    [characters, persist],
  );

  const removeCharacter = useCallback(
    async (id: string) => {
      const nextCharacters = characters.filter((character) => character.id !== id);
      const nextSelected =
        selectedCharacterId === id ? nextCharacters[0]?.id ?? null : selectedCharacterId;
      setCharacters(nextCharacters);
      setSelectedCharacterId(nextSelected);
      await persist({ characters: nextCharacters, selectedCharacterId: nextSelected });
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

  const setGeneratedStory = useCallback((story: Omit<Story, "id" | "createdAt">) => {
    setCurrentStory({
      ...story,
      id: createId(),
      createdAt: new Date().toISOString(),
    });
  }, []);

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
      const story = savedStories.find((savedStory) => savedStory.id === id) ?? null;
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
    () => characters.find((character) => character.id === selectedCharacterId) ?? null,
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

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

export function useStoryStudio() {
  const value = useContext(StoryContext);
  if (!value) {
    throw new Error("useStoryStudio must be used inside StoryProvider.");
  }
  return value;
}
