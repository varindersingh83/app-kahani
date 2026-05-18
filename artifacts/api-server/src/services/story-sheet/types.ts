import type { GenerateStoryRequest } from "@workspace/api-zod";

export type StorySheetStep =
  | "queued"
  | "writing_story"
  | "painting_sheet"
  | "slicing_pages"
  | "preparing_reader"
  | "complete"
  | "failed";

export type StorySheetJobStatus = "queued" | "running" | "complete" | "failed";

export type ApiUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number;
  total_cost?: number;
  [key: string]: unknown;
};

export type AiConfig = {
  baseUrl: string;
  apiKey: string;
  textModel: string;
  imageModel: string;
  openRouterSiteUrl?: string;
  openRouterAppTitle?: string;
};

export type StorySheetInput = {
  title: string;
  child_name: string;
  parent_name: string;
  parent_role: string;
  behavior: string;
  pages: Array<{
    page: number;
    text: string;
    scene: string;
    composition: string;
    emotion: string;
  }>;
};

export type SheetSliceManifestEntry = {
  pageNumber: number;
  row: number;
  col: number;
  output: string;
  crop?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
};

export type StorySheetArtifactLinks = {
  bookHtmlUrl?: string;
  storyJsonUrl?: string;
  usageJsonUrl?: string;
};

export type StorySheetGeneratedPage = {
  pageNumber: number;
  text: string;
  illustrationPrompt: string;
  imageUrl?: string;
  scene?: string;
  composition?: string;
  emotion?: string;
};

export type StorySheetGeneratedStory = {
  title: string;
  pages: StorySheetGeneratedPage[];
  reflectionQuestion: string;
  coverImageUrl?: string;
  endImageUrl?: string;
  sheetImageUrl?: string;
  artifactLinks?: StorySheetArtifactLinks;
};

export type StorySheetPlannedIssue = {
  issue: string;
  bookIntent: string;
};

export type StorySheetJob = {
  bookId: string;
  status: StorySheetJobStatus;
  step: StorySheetStep;
  message: string;
  createdAt: string;
  updatedAt: string;
  outputDir: string;
  request: GenerateStoryRequest;
  plannedIssues?: StorySheetPlannedIssue[];
  activeIssue?: string;
  issueNotice?: string;
  story?: StorySheetGeneratedStory;
  error?: string;
};

export type StorySheetImageQa = {
  bookId: string;
  sheetImageFileName: string;
  status: "needs_human_review";
  summary: string;
  referenceImages: Array<{
    role: "main_child" | "parent";
    uriKind: "data" | "http" | "file" | "other";
    attached: boolean;
  }>;
  panelChecks: Array<{
    panel: number;
    row: number;
    col: number;
    fileName: string;
    role:
      | "cover_illustration"
      | "opening_illustration"
      | "closing_illustration"
      | "blank_panel"
      | "story_illustration";
    criteria: string[];
  }>;
};

export type StorySheetRunResult = {
  story: StorySheetGeneratedStory;
  storyJson: StorySheetInput;
  slices: SheetSliceManifestEntry[];
  imageQa: StorySheetImageQa;
  usage: {
    textModel: string;
    imageModel: string;
    story: ApiUsage | null;
    sheet: ApiUsage | null;
    total: ApiUsage;
  };
};
