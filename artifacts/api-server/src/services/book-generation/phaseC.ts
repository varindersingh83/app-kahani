import { GenerateStoryResponse } from "@workspace/api-zod";
import type { PipelineStory, PipelineStoryPage, SheetPlacement, SheetPlan } from "./types";

export type ProducedPage = PipelineStoryPage & {
  retryCount: number;
  flagForHuman: boolean;
  alignmentScore?: number;
  failureReason?: string;
  imageUrl?: string;
  sheetPlacement?: SheetPlacement;
};

export function runLayoutAgent(pages: ProducedPage[], sheetPlan?: SheetPlan) {
  const orderedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  return {
    format: "mobile_picture_book",
    pageCount: orderedPages.length,
    pages: orderedPages,
    sheetPlan: sheetPlan
      ? {
          rows: sheetPlan.rows,
          cols: sheetPlan.cols,
          inset: sheetPlan.inset,
          sheetPrompt: sheetPlan.sheetPrompt,
          tiles: sheetPlan.tiles,
        }
      : undefined,
  };
}

export function runEditorAgent(story: PipelineStory): PipelineStory {
  return {
    ...story,
    pages: story.pages.map((page) => ({
      ...page,
      text: page.text.trim(),
      illustrationPrompt: page.illustrationPrompt.trim(),
      imageUrl: page.imageUrl?.trim(),
    })),
  };
}

export function runPackagingAgent(input: {
  title: string;
  reflectionQuestion: string;
  pages: ProducedPage[];
  coverImageUrl?: string;
  sheetImageUrl?: string;
  sheetPlan?: SheetPlan;
}): PipelineStory {
  const layout = runLayoutAgent(input.pages, input.sheetPlan);
  const story = runEditorAgent({
    title: input.title.trim(),
    reflectionQuestion: input.reflectionQuestion.trim(),
    pages: layout.pages.map((page) => ({
      pageNumber: page.pageNumber,
      text: page.text,
      illustrationPrompt: page.illustrationPrompt,
      imageUrl: page.imageUrl,
    })),
    coverImageUrl: input.coverImageUrl,
    sheetImageUrl: input.sheetImageUrl,
  });

  return GenerateStoryResponse.parse(story);
}

export function runHumanQaGate(pages: ProducedPage[], bookFlagForHuman = false) {
  const flaggedPages = pages.filter((page) => page.flagForHuman).map((page) => page.pageNumber);
  const retryTotal = pages.reduce((total, page) => total + page.retryCount, 0);
  const flaggedForHuman = bookFlagForHuman || flaggedPages.length > 0;

  return {
    status: flaggedForHuman ? "qa_required" : "completed",
    flaggedForHuman,
    flaggedPages,
    retryTotal,
  };
}
