import type { CharacterLock, PageCandidate, PipelineStory, PipelineStoryPage, SheetPlan, StorySetup } from "./types";
import { buildSheetPlan } from "./sheet";
import { selectBestCandidate, validateAlignment, validatePage } from "./validation";

export const MAX_PAGE_RETRIES = 3;

export type PageWorkerInput = {
  page: PipelineStoryPage;
  storyboardBeat: StorySetup["storyboard"][number];
  characterLock: CharacterLock;
};

export type IllustrationCandidate = PageCandidate & {
  retryCount: number;
  failures: string[];
};

export function runPromptBuilderAgent(input: PageWorkerInput) {
  return {
    pageNumber: input.page.pageNumber,
    text: input.page.text,
    visualBeat: input.storyboardBeat.visualFocus,
    emotion: input.storyboardBeat.emotion,
    sheetPlacement: input.storyboardBeat.sheetPlacement,
    illustrationPrompt: [
      input.page.illustrationPrompt,
      input.characterLock.stylePrompt,
      `Scene emotion: ${input.storyboardBeat.emotion}.`,
      `Visual focus: ${input.storyboardBeat.visualFocus}.`,
      `Sheet panel: ${input.storyboardBeat.sheetPlacement.panelLabel}.`,
      `Negative prompt: ${input.characterLock.negativePrompt}`,
    ].join(" "),
  };
}

export function runIllustrationAgentV1(prompt: ReturnType<typeof runPromptBuilderAgent>) {
  return {
    pageNumber: prompt.pageNumber,
    text: prompt.text,
    illustrationPrompt: prompt.illustrationPrompt,
    sheetPlacement: prompt.sheetPlacement,
  };
}

export function runSheetArtDirectionAgent(input: {
  story: PipelineStory;
  setup: StorySetup;
  characterLock: CharacterLock;
}): SheetPlan {
  return buildSheetPlan(input);
}

export function runAlignmentAgent(page: PipelineStoryPage, childName: string) {
  const pageValidation = validatePage(page);
  const alignment = validateAlignment(page, childName);
  const failures = [...pageValidation.failures, ...alignment.failures];

  return {
    ok: failures.length === 0,
    score: alignment.score,
    failures,
  };
}

export function runIterationController(input: {
  candidates: IllustrationCandidate[];
  maxRetries?: number;
}) {
  const maxRetries = input.maxRetries ?? MAX_PAGE_RETRIES;
  const latest = input.candidates[input.candidates.length - 1];
  const bestCandidate = selectBestCandidate(input.candidates);

  if (!latest) {
    return {
      status: "retry" as const,
      shouldRetry: true,
      retryCount: 0,
      flagForHuman: false,
      selectedCandidate: null,
      failureReason: "no candidates available",
    };
  }

  if (latest.failures.length === 0) {
    return {
      status: "completed" as const,
      shouldRetry: false,
      retryCount: latest.retryCount,
      flagForHuman: false,
      selectedCandidate: latest,
      failureReason: undefined,
    };
  }

  if (latest.retryCount >= maxRetries) {
    return {
      status: "qa_required" as const,
      shouldRetry: false,
      retryCount: latest.retryCount,
      flagForHuman: true,
      selectedCandidate: bestCandidate,
      failureReason: latest.failures.join("; "),
    };
  }

  return {
    status: "retry" as const,
    shouldRetry: true,
    retryCount: latest.retryCount + 1,
    flagForHuman: false,
    selectedCandidate: latest,
    failureReason: latest.failures.join("; "),
  };
}

export function runPageProductionAttempt(input: {
  page: PipelineStoryPage;
  storyboardBeat: StorySetup["storyboard"][number];
  characterLock: CharacterLock;
  childName: string;
  retryCount: number;
}): IllustrationCandidate {
  const prompt = runPromptBuilderAgent(input);
  const candidate = runIllustrationAgentV1(prompt);
  const alignment = runAlignmentAgent(candidate, input.childName);

  return {
    ...candidate,
    retryCount: input.retryCount,
    alignmentScore: alignment.score,
    failures: alignment.failures,
    failureReason: alignment.failures.join("; ") || undefined,
    sheetPlacement: input.storyboardBeat.sheetPlacement,
  };
}
