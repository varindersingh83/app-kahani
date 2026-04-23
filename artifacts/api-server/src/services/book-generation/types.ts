import type {
  GenerateStoryRequest,
  GeneratedStory,
  StoryPage,
} from "@workspace/api-zod";

export type StoryRequest = GenerateStoryRequest;
export type PipelineStory = GeneratedStory & {
  sheetImageUrl?: string;
  pages: Array<StoryPage & {
    imageUrl?: string;
  }>;
};
export type PipelineStoryPage = StoryPage & {
  imageUrl?: string;
};

export type AiConfig = {
  baseUrl: string;
  apiKey: string;
  textModel: string;
  imageModel: string;
  openRouterSiteUrl?: string;
  openRouterAppTitle?: string;
};

export type CharacterLock = {
  name: string;
  appearance: string;
  stylePrompt: string;
  negativePrompt: string;
};

export type SheetPlacement = {
  pageNumber: number;
  row: number;
  col: number;
  panelLabel: string;
};

export type SheetTile = {
  pageNumber: number;
  row: number;
  col: number;
  panelLabel: string;
  beat: string;
  visualFocus: string;
  emotion: string;
};

export type SheetPlan = {
  rows: number;
  cols: number;
  inset: number;
  sheetPrompt: string;
  tiles: SheetTile[];
};

export type StorySetup = {
  spine: {
    beginning: string;
    middle: string;
    ending: string;
    emotionalArc: string;
  };
  storyboard: Array<{
    pageNumber: number;
    beat: string;
    visualFocus: string;
    emotion: string;
    sheetPlacement: SheetPlacement;
  }>;
  characterLock: CharacterLock;
};

export type PageCandidate = PipelineStoryPage & {
  alignmentScore: number;
  failureReason?: string;
  sheetPlacement?: SheetPlacement;
};

export type ValidationResult = {
  ok: boolean;
  failures: string[];
};

export type PipelineResult = {
  bookId: string;
  status: string;
  story: PipelineStory;
  flaggedForHuman: boolean;
  retryTotal: number;
};
