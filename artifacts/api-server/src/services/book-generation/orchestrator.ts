import { GenerateStoryResponse } from "@workspace/api-zod";
import type { AiConfig, CharacterLock, PageCandidate, PipelineResult, PipelineStory, PipelineStoryPage, StoryRequest } from "./types";
import { generateCoverImage, generateInitialStory, rewritePage } from "./aiClient";
import {
  buildBehaviorContext,
  buildBookSetup,
  buildSupportingCastContext,
  runInputAgent,
  runStorySpineAgent,
  runStoryWriterValidation,
} from "./phaseA";
import { runSheetArtDirectionAgent } from "./phaseB";
import type { SheetPlan } from "./types";
import { runHumanQaGate, runPackagingAgent } from "./phaseC";
import { buildRetryLearningLesson } from "./learning";
import {
  createBookRecord,
  createPageRecord,
  getBookEvents,
  getBookWithPages,
  getQaBooks,
  logAgentRun,
  logEvent,
  recentLearningHints,
  recordLearningEvent,
  updateBookRecord,
  updatePageRecord,
} from "./repository";
import { selectBestCandidate, validateAlignment, validatePage } from "./validation";

const PAGE_COUNT = 12;
const MAX_RETRIES = 3;

export async function runBookPipeline(request: StoryRequest, config: AiConfig): Promise<PipelineResult> {
  const childName = request.character.name;
  const book = await createBookRecord({
    mode: request.mode,
    theme: request.prompt,
    pageCount: PAGE_COUNT,
    characterName: childName,
    characterPhotoUri: request.character.photoUri,
    requestJson: request as unknown as Record<string, unknown>,
  });

  await logEvent({
    bookId: book.id,
    agent: "MasterOrchestrator",
    eventType: "book_created",
    payloadJson: { mode: request.mode, pageCount: PAGE_COUNT },
  });

  try {
    await updateBookRecord(book.id, { status: "running", currentStep: "input" });
    await logAgentRun({
      agentName: "InputAgent",
      bookId: book.id,
      inputJson: request as unknown as Record<string, unknown>,
      run: async () => runInputAgent(request),
    });

    const learningHints = await recentLearningHints();
    await logEvent({
      bookId: book.id,
      agent: "LearningLayer",
      eventType: "hints_loaded",
      payloadJson: { hasHints: Boolean(learningHints) },
    });

    await updateBookRecord(book.id, { currentStep: "story_writer" });
    const story = await logAgentRun({
      agentName: "StoryWriterAgent",
      bookId: book.id,
      inputJson: { mode: request.mode, prompt: request.prompt, learningHints },
      run: async () =>
        generateInitialStory(
          config,
          childName,
          buildBehaviorContext(request),
          buildSupportingCastContext(request),
          learningHints,
        ),
    });

    const storyValidation = runStoryWriterValidation(story);
    if (!storyValidation.ok) {
      await recordLearningEvent({
        bookId: book.id,
        agent: "StoryWriterAgent",
        failureType: "story_schema_validation",
        lesson: `Initial story failed validation: ${storyValidation.failures.slice(0, 3).join("; ")}`,
        payloadJson: { failures: storyValidation.failures },
      });
      await logEvent({
        bookId: book.id,
        agent: "StoryWriterAgent",
        eventType: "validation_failed",
        payloadJson: { failures: storyValidation.failures },
      });
    }

    const setup = buildBookSetup(request, story);
    const sheetPlan = runSheetArtDirectionAgent({
      story,
      setup,
      characterLock: setup.characterLock,
    });
    await updateBookRecord(book.id, {
      currentStep: "character_consistency",
      setupJson: { ...setup, sheetPlan } as unknown as Record<string, unknown>,
      characterLock: setup.characterLock as unknown as Record<string, unknown>,
    });
    await logAgentRun({
      agentName: "StorySpineAgent",
      bookId: book.id,
      run: async () => runStorySpineAgent(story),
    });
    await logAgentRun({
      agentName: "StoryboardAgent",
      bookId: book.id,
      run: async () => ({ storyboard: setup.storyboard }),
    });
    await logAgentRun({
      agentName: "CharacterConsistencyAgent",
      bookId: book.id,
      run: async () => setup.characterLock,
    });
    await logAgentRun({
      agentName: "SheetArtDirectionAgent",
      bookId: book.id,
      run: async () => sheetPlan,
    });

    await updateBookRecord(book.id, { currentStep: "page_production" });
    const pages = await Promise.all(
      Array.from({ length: PAGE_COUNT }, (_, index) =>
        runPageWorker({
          bookId: book.id,
          pageNumber: index + 1,
          childName,
          story,
          characterLock: setup.characterLock,
          sheetPlan,
          config,
        }),
      ),
    );

    const qaGate = runHumanQaGate(pages);
    const finalStory = GenerateStoryResponse.parse({
      title: story.title,
      pages: [...pages].sort((a, b) => a.pageNumber - b.pageNumber).map((page) => ({
        pageNumber: page.pageNumber,
        text: page.text,
        illustrationPrompt: page.illustrationPrompt,
      })),
      reflectionQuestion: story.reflectionQuestion,
    });

    await updateBookRecord(book.id, { currentStep: "layout" });
    await logAgentRun({
      agentName: "LayoutAgent",
      bookId: book.id,
      run: async () => ({ pageCount: finalStory.pages.length, format: "mobile_picture_book" }),
    });

    await updateBookRecord(book.id, { currentStep: "editor" });
    await logAgentRun({
      agentName: "EditorAgent",
      bookId: book.id,
      run: async () => ({
        readability: "age_2_5",
        note: "Editor pass accepted deterministic page outputs for v1.",
      }),
    });

    let coverImageUrl: string | undefined;
    try {
      coverImageUrl = await generateCoverImage(config, childName, finalStory);
    } catch {
      coverImageUrl = undefined;
    }

    const packagedStory = runPackagingAgent({
      title: finalStory.title,
      reflectionQuestion: finalStory.reflectionQuestion,
      pages,
      coverImageUrl,
      sheetPlan,
    });
    await updateBookRecord(book.id, {
      status: qaGate.status,
      currentStep: "packaging",
      title: packagedStory.title,
      reflectionQuestion: packagedStory.reflectionQuestion,
      coverImageUrl,
      flaggedForHuman: qaGate.flaggedForHuman,
      packageJson: packagedStory as unknown as Record<string, unknown>,
    });
    await logAgentRun({
      agentName: "PackagingAgent",
      bookId: book.id,
      run: async () => ({ status: qaGate.status, retryTotal: qaGate.retryTotal }),
    });

    await logEvent({
      bookId: book.id,
      agent: "MasterOrchestrator",
      eventType: "book_completed",
      payloadJson: { flaggedForHuman: qaGate.flaggedForHuman, retryTotal: qaGate.retryTotal },
    });

    return {
      bookId: book.id,
      status: qaGate.status,
      story: packagedStory,
      flaggedForHuman: qaGate.flaggedForHuman,
      retryTotal: qaGate.retryTotal,
    };
  } catch (error) {
    await updateBookRecord(book.id, {
      status: "failed",
      currentStep: "failed",
    });
    await logEvent({
      bookId: book.id,
      agent: "MasterOrchestrator",
      eventType: "book_failed",
      payloadJson: { error: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  }
}

export async function readBookStatus(bookId: string) {
  const result = await getBookWithPages(bookId);
  if (!result) return null;
  return {
    bookId: result.book.id,
    status: result.book.status,
    currentStep: result.book.currentStep,
    title: result.book.title,
    pageCount: result.book.pageCount,
    flaggedForHuman: result.book.flaggedForHuman,
    retryTotal: result.pages.reduce((total, page) => total + page.retryCount, 0),
    story: result.book.packageJson,
    createdAt: result.book.createdAt.toISOString(),
    updatedAt: result.book.updatedAt.toISOString(),
  };
}

export async function readBookPages(bookId: string) {
  const result = await getBookWithPages(bookId);
  if (!result) return null;
  return result.pages.map((page) => ({
    pageId: page.id,
    bookId: page.bookId,
    pageNumber: page.pageNumber,
    currentStep: page.currentStep,
    status: page.status,
    text: page.text,
    illustrationPrompt: page.illustrationPrompt,
    alignmentScore: page.alignmentScore,
    retryCount: page.retryCount,
    flagForHuman: page.flagForHuman,
    failureReason: page.failureReason,
  }));
}

export async function readBookEvents(bookId: string) {
  return (await getBookEvents(bookId)).map((event) => ({
    eventId: event.id,
    bookId: event.bookId,
    pageId: event.pageId,
    agent: event.agent,
    eventType: event.eventType,
    payloadJson: event.payloadJson,
    createdAt: event.createdAt.toISOString(),
  }));
}

export async function readQaQueue() {
  return (await getQaBooks()).map((book) => ({
    bookId: book.id,
    status: book.status,
    currentStep: book.currentStep,
    title: book.title,
    flaggedForHuman: book.flaggedForHuman,
    updatedAt: book.updatedAt.toISOString(),
  }));
}

async function runPageWorker(input: {
  bookId: string;
  pageNumber: number;
  childName: string;
  story: PipelineStory;
  characterLock: CharacterLock;
  sheetPlan: SheetPlan;
  config: AiConfig;
}) {
  const sheetTile = input.sheetPlan.tiles.find((tile) => tile.pageNumber === input.pageNumber);
  const originalPage = input.story.pages.find((page) => page.pageNumber === input.pageNumber) ?? {
    pageNumber: input.pageNumber,
    text: "",
    illustrationPrompt: "",
  };
  const page = await createPageRecord({
    bookId: input.bookId,
    pageNumber: input.pageNumber,
    text: originalPage.text,
    illustrationPrompt: originalPage.illustrationPrompt,
    promptJson: {
      sheetPlacement: sheetTile ?? null,
      sheetPrompt: input.sheetPlan.sheetPrompt,
    },
  });

  await logEvent({
    bookId: input.bookId,
    pageId: page.id,
    agent: "PromptBuilderAgent",
    eventType: "page_started",
    payloadJson: { pageNumber: input.pageNumber },
  });

  let bestPage: PipelineStoryPage = originalPage;
  let bestScore = 0;
  let retryCount = 0;
  let flagForHuman = false;
  let failureReason: string | undefined;
  const candidates: Array<PageCandidate & { retryCount: number; failures: string[] }> = [];

  while (retryCount <= MAX_RETRIES) {
    const pageValidation = validatePage(bestPage);
    const alignment = validateAlignment(bestPage, input.childName);
    bestScore = Math.max(bestScore, alignment.score);
    const failures = [...pageValidation.failures, ...alignment.failures];
    candidates.push({
      retryCount,
      ...bestPage,
      alignmentScore: alignment.score,
      failureReason: failures.join("; ") || undefined,
      failures,
      sheetPlacement: sheetTile
        ? {
            pageNumber: input.pageNumber,
            row: sheetTile.row,
            col: sheetTile.col,
            panelLabel: sheetTile.panelLabel,
          }
        : undefined,
    });

    await updatePageRecord(page.id, {
      currentStep: "alignment",
      status: failures.length === 0 ? "accepted" : "retrying",
      text: bestPage.text,
      illustrationPrompt: bestPage.illustrationPrompt,
      alignmentScore: alignment.score,
      retryCount,
      candidatesJson: candidates as unknown as Array<Record<string, unknown>>,
      failureReason: failures.join("; ") || undefined,
    });
    await logEvent({
      bookId: input.bookId,
      pageId: page.id,
      agent: "AlignmentAgent",
      eventType: "score_generated",
      payloadJson: {
        score: alignment.score,
        status: failures.length === 0 ? "accepted" : "retry",
        failures,
      },
    });

    if (failures.length === 0) {
      failureReason = undefined;
      break;
    }

    failureReason = failures.join("; ");
    await recordLearningEvent({
      bookId: input.bookId,
      pageId: page.id,
      agent: "IterationController",
      failureType: "page_validation_or_alignment",
      lesson: buildRetryLearningLesson({
        pageNumber: input.pageNumber,
        failures,
        retryCount,
      }),
      payloadJson: { pageNumber: input.pageNumber, failures, retryCount },
    });

    if (retryCount >= MAX_RETRIES) {
      flagForHuman = true;
      await logEvent({
        bookId: input.bookId,
        pageId: page.id,
        agent: "IterationController",
        eventType: "max_retries_reached",
        payloadJson: { retryCount, failureReason },
      });
      break;
    }

    retryCount += 1;
    await logEvent({
      bookId: input.bookId,
      pageId: page.id,
      agent: "IterationController",
      eventType: "retry_scheduled",
      payloadJson: { retryCount, failures },
    });

    bestPage = await logAgentRun({
      agentName: "PromptBuilderAgent",
      bookId: input.bookId,
      pageId: page.id,
      inputJson: { failures, retryCount },
      run: async () =>
        rewritePage(
          input.config,
          input.story,
          input.pageNumber,
          input.childName,
          input.characterLock.stylePrompt,
          failures,
        ),
    });
  }

  if (flagForHuman) {
    const selected = selectBestCandidate(candidates);
    if (selected) {
      bestPage = {
        pageNumber: selected.pageNumber,
        text: selected.text,
        illustrationPrompt: selected.illustrationPrompt,
      };
      bestScore = selected.alignmentScore;
      failureReason = selected.failureReason;
    }
  }

  await updatePageRecord(page.id, {
    currentStep: "iteration_controller",
    status: flagForHuman ? "qa_required" : "completed",
    text: bestPage.text,
    illustrationPrompt: bestPage.illustrationPrompt,
    alignmentScore: bestScore,
    retryCount,
    flagForHuman,
    failureReason,
    candidatesJson: candidates as unknown as Array<Record<string, unknown>>,
  });

  return {
    ...bestPage,
    alignmentScore: bestScore,
    retryCount,
    flagForHuman,
    failureReason,
  };
}
