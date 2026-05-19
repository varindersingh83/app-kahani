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

export type BookBrief = {
  mode: string;
  prompt?: string;
  childName: string;
  behaviorContext: string;
  supportingCastContext: string;
  learningHints: string;
};

export type BookSetup = {
  brief: BookBrief;
  characterLock: CharacterLock;
  pageSlots: SheetPlacement[];
};

export type StorySpine = {
  beginning: string;
  middle: string;
  ending: string;
  emotionalArc: string;
};

export type StoryPlanPage = {
  pageNumber: number;
  text: string;
  illustrationPrompt: string;
  sheetPlacement: SheetPlacement;
  beat: string;
  visualFocus: string;
  emotion: string;
};

export type StoryPlan = {
  title: string;
  reflectionQuestion: string;
  storySpine: StorySpine;
  masterSheetPrompt: string;
  pages: StoryPlanPage[];
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

export type PageCandidate = PipelineStoryPage & {
  alignmentScore: number;
  failureReason?: string;
  sheetPlacement?: SheetPlacement;
};

export type ValidationResult = {
  ok: boolean;
  failures: string[];
};

export type SheetSliceManifestEntry = {
  pageNumber: number;
  row: number;
  col: number;
  source: string;
  output: string;
  crop: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
};

export type PipelineResult = {
  bookId: string;
  status: string;
  story: PipelineStory;
  flaggedForHuman: boolean;
  retryTotal: number;
};
