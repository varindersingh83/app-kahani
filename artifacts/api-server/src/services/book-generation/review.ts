import type { PipelineStoryPage, SheetSliceManifestEntry, StoryPlanPage } from "./types";
import { validateAlignment } from "./validation";

export type ReviewedPage = PipelineStoryPage & {
  alignmentScore: number;
  failureReason?: string;
  flagForHuman: boolean;
  reviewNotes: string[];
  sheetPlacement?: StoryPlanPage["sheetPlacement"];
};

export type StoryReview = {
  pages: ReviewedPage[];
  flaggedPages: number[];
  shouldEscalate: boolean;
};

const REWRITE_THRESHOLD = 0.58;

export function reviewStoryPages(input: {
  childName: string;
  pages: StoryPlanPage[];
  slices: SheetSliceManifestEntry[];
}): StoryReview {
  const reviewedPages = input.pages
    .slice()
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((page) => {
      const slice = input.slices.find((entry) => entry.pageNumber === page.pageNumber);
      const alignment = validateAlignment(page, input.childName);
      const reviewNotes: string[] = [];
      let text = page.text.trim();
      let failureReason = page.sheetPlacement ? undefined : "missing sheet placement";
      let flagForHuman = false;

      if (!slice) {
        reviewNotes.push("missing sliced page image");
        flagForHuman = true;
        failureReason = "missing page image slice";
      }

      if (shouldRewriteText(page.text, alignment.score)) {
        const rewrittenText = rewritePageText(page, input.childName);
        if (rewrittenText !== text) {
          reviewNotes.push("text rewritten to better match the storyboard panel");
          text = rewrittenText;
        }
      }

      if (alignment.score < 0.45 || !slice) {
        flagForHuman = true;
      }

      return {
        ...page,
        text,
        alignmentScore: alignment.score,
        failureReason,
        flagForHuman,
        reviewNotes,
      };
    });

  const flaggedPages = reviewedPages.filter((page) => page.flagForHuman).map((page) => page.pageNumber);
  return {
    pages: reviewedPages,
    flaggedPages,
    shouldEscalate: flaggedPages.length > 0,
  };
}

function rewritePageText(page: StoryPlanPage, childName: string) {
  const focus = extractFocusPhrase(page.illustrationPrompt);
  const mood = page.emotion || "gentle";
  if (!focus) {
    return `${childName} moves through page ${page.pageNumber} with a ${mood} feeling.`;
  }

  return `${childName} notices ${focus} and keeps a ${mood} heart.`;
}

function shouldRewriteText(text: string, alignmentScore: number) {
  if (alignmentScore < REWRITE_THRESHOLD) return true;
  if (/^ava page \d+\.?$/i.test(text.trim())) return true;
  if (/^page \d+\.?$/i.test(text.trim())) return true;
  return false;
}

function extractFocusPhrase(prompt: string) {
  const parts = prompt
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const focus = parts[2] ?? parts[1] ?? "";
  return focus
    .replace(/^Page \d+:\s*/i, "")
    .replace(/^watercolor scene of\s+/i, "")
    .replace(/\s+consistent outfit.*$/i, "")
    .trim();
}
