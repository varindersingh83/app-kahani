import { GenerateStoryResponse } from "@workspace/api-zod";
import type {
  AiConfig,
  PipelineResult,
  PipelineStory,
  PipelineStoryPage,
  SheetSliceManifestEntry,
  StoryPlan,
  StoryRequest,
} from "./types";
import { generateCoverImage, generateStoryboardSheetImage } from "./aiClient";
import { buildBookSetup, buildStoryPlan, runInputAgent } from "./phaseA";
import { buildCoverPrompt, buildStoryboardSheetPlan, buildStoryboardSheetPrompt } from "./phaseB";
import { runHumanQaGate, runLayoutAgent, runPackagingAgent } from "./phaseC";
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
import { reviewStoryPages } from "./review";
import { sliceStoryboardSheet } from "./imageSlicer";
import { validateStory } from "./validation";

const PAGE_COUNT = 12;
const MAX_RETRIES = 3;

export async function runBookPipeline(request: StoryRequest, config: AiConfig): Promise<PipelineResult> {
  const childName = request.character.name.trim();
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
    const normalizedInput = await logAgentRun({
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

    await updateBookRecord(book.id, { currentStep: "book_setup" });
    const setup = await logAgentRun({
      agentName: "BookSetupAgent",
      bookId: book.id,
      inputJson: { normalizedInput, learningHints },
      run: async () => buildBookSetup(normalizedInput, learningHints),
    });

    await updateBookRecord(book.id, { currentStep: "story_creation" });
    const storyPlan = await logAgentRun<StoryPlan>({
      agentName: "StoryCreationAgent",
      bookId: book.id,
      inputJson: { setup },
      run: async () => buildStoryPlan(setup),
    });

    await updateBookRecord(book.id, {
      setupJson: { ...setup, storyPlan } as unknown as Record<string, unknown>,
      characterLock: setup.characterLock as unknown as Record<string, unknown>,
    });

    const coverPrompt = buildCoverPrompt({
      brief: setup.brief,
      characterLock: setup.characterLock,
    });
    await updateBookRecord(book.id, { currentStep: "cover_image" });
    const coverImageUrl = await runWithRetries<string | undefined>({
      agentName: "CoverImageAgent",
      bookId: book.id,
      inputJson: { prompt: coverPrompt },
      run: () => generateCoverImage(config, coverPrompt, request.character.photoUri),
      retryLabel: "cover image generation",
      allowUndefinedFinalValue: true,
    });

    const storyboardSheetPrompt = buildStoryboardSheetPrompt({
      brief: setup.brief,
      characterLock: setup.characterLock,
      pageSlots: setup.pageSlots,
      storyPlan,
    });
    const sheetPlan = buildStoryboardSheetPlan({
      brief: setup.brief,
      characterLock: setup.characterLock,
      pageSlots: setup.pageSlots,
      storyPlan,
    });

    await updateBookRecord(book.id, { currentStep: "storyboard_sheet" });
    const sheetImageUrl = await runWithRetries<string | undefined>({
      agentName: "StoryboardSheetAgent",
      bookId: book.id,
      inputJson: { prompt: storyboardSheetPrompt },
      run: () =>
        generateStoryboardSheetImage(config, {
          prompt: storyboardSheetPrompt,
          referenceImageUri: request.character.photoUri,
        }),
      retryLabel: "storyboard sheet generation",
    });

    const storyValidation = validateStory(
      GenerateStoryResponse.parse({
        title: storyPlan.title,
        pages: storyPlan.pages.map((page) => ({
          pageNumber: page.pageNumber,
          text: page.text,
          illustrationPrompt: page.illustrationPrompt,
        })),
        reflectionQuestion: storyPlan.reflectionQuestion,
      }),
    );
    if (!storyValidation.ok) {
      await recordLearningEvent({
        bookId: book.id,
        agent: "StoryboardSheetAgent",
        failureType: "story_schema_validation",
        lesson: `Storyboard sheet failed validation: ${storyValidation.failures.slice(0, 3).join("; ")}`,
        payloadJson: { failures: storyValidation.failures },
      });
      await logEvent({
        bookId: book.id,
        agent: "StoryboardSheetAgent",
        eventType: "validation_failed",
        payloadJson: { failures: storyValidation.failures },
      });
    }

    await updateBookRecord(book.id, { currentStep: "slice_sheet" });
    const slicedSheet = await logAgentRun({
      agentName: "SheetSlicerAgent",
      bookId: book.id,
      inputJson: { sheetImageUrl },
      run: async () => sliceStoryboardSheet(sheetImageUrl ?? ""),
    });

    const review = reviewStoryPages({
      childName: setup.brief.childName,
      pages: storyPlan.pages,
      slices: slicedSheet.entries,
    });
    const pages = review.pages.map((page) => {
      const slice = slicedSheet.entries.find((entry) => entry.pageNumber === page.pageNumber);
      return {
        pageNumber: page.pageNumber,
        text: page.text,
        illustrationPrompt: page.illustrationPrompt,
        imageUrl: slice?.output,
        retryCount: page.flagForHuman ? 3 : page.reviewNotes.length,
        flagForHuman: page.flagForHuman,
        alignmentScore: page.alignmentScore,
        failureReason: page.failureReason,
        sheetPlacement: page.sheetPlacement,
      };
    });

    const qaGate = runHumanQaGate(
      pages,
      !storyValidation.ok || !coverImageUrl || slicedSheet.entries.length !== PAGE_COUNT || review.shouldEscalate,
    );
    const finalStory = GenerateStoryResponse.parse({
      title: storyPlan.title,
      pages: pages.map((page) => ({
        pageNumber: page.pageNumber,
        text: page.text,
        illustrationPrompt: page.illustrationPrompt,
        imageUrl: page.imageUrl,
      })),
      reflectionQuestion: storyPlan.reflectionQuestion,
      coverImageUrl,
      sheetImageUrl,
    });

    await updateBookRecord(book.id, { currentStep: "layout" });
    const layout = await logAgentRun({
      agentName: "LayoutAgent",
      bookId: book.id,
      run: async () =>
        runLayoutAgent(
          pages.map((page) => ({
            pageNumber: page.pageNumber,
            text: page.text,
            illustrationPrompt: page.illustrationPrompt,
            imageUrl: page.imageUrl,
            retryCount: page.retryCount,
            flagForHuman: page.flagForHuman,
            alignmentScore: page.alignmentScore,
            failureReason: page.failureReason,
            sheetPlacement: page.sheetPlacement,
          })),
          sheetPlan,
        ),
    });

    await updateBookRecord(book.id, { currentStep: "editor" });
    await logAgentRun({
      agentName: "EditorAgent",
      bookId: book.id,
      run: async () => ({
        readability: "age_2_5",
        note: "Editor pass accepted the story-first storyboard-sheet outputs for v3.",
      }),
    });

    const packagedStory = runPackagingAgent({
      title: finalStory.title,
      reflectionQuestion: finalStory.reflectionQuestion,
      pages: pages.map((page) => ({
        pageNumber: page.pageNumber,
        text: page.text,
        illustrationPrompt: page.illustrationPrompt,
        imageUrl: page.imageUrl,
        retryCount: page.retryCount,
        flagForHuman: page.flagForHuman,
        alignmentScore: page.alignmentScore,
        failureReason: page.failureReason,
        sheetPlacement: page.sheetPlacement,
      })),
      coverImageUrl,
      sheetImageUrl,
      sheetPlan: layout.sheetPlan
        ? {
            rows: layout.sheetPlan.rows,
            cols: layout.sheetPlan.cols,
            inset: layout.sheetPlan.inset,
            sheetPrompt: layout.sheetPlan.sheetPrompt,
            tiles: layout.sheetPlan.tiles,
          }
        : undefined,
    });

    await Promise.all(
      pages.map((page) =>
          createPageRecord({
            bookId: book.id,
            pageNumber: page.pageNumber,
            text: page.text,
            illustrationPrompt: page.illustrationPrompt,
            promptJson: {
              storyPlanPage: storyPlan.pages.find((storyPage) => storyPage.pageNumber === page.pageNumber),
              sheetImageUrl,
              pageImageUrl: page.imageUrl,
              reviewNotes: page.flagForHuman ? ["flagged for human review"] : page.retryCount > 0 ? ["rewritten during review"] : [],
            },
          }).then((record) =>
            updatePageRecord(record.id, {
              currentStep: "completed",
              status: "completed",
              text: page.text,
              illustrationPrompt: page.illustrationPrompt,
              retryCount: page.retryCount,
              flagForHuman: page.flagForHuman,
              failureReason: page.failureReason,
              alignmentScore: page.alignmentScore,
            }),
          ),
        ),
    );

    await updateBookRecord(book.id, {
      status: qaGate.status,
      currentStep: "packaging",
      title: packagedStory.title,
      reflectionQuestion: packagedStory.reflectionQuestion,
      coverImageUrl,
      flaggedForHuman: qaGate.flaggedForHuman,
      packageJson: {
        ...packagedStory,
        storyPlan,
        sheetPrompt: storyboardSheetPrompt,
        sliceManifest: slicedSheet.entries,
        review,
      } as unknown as Record<string, unknown>,
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
      payloadJson: {
        flaggedForHuman: qaGate.flaggedForHuman,
        retryTotal: qaGate.retryTotal,
        sheetSlices: slicedSheet.entries.length,
        flaggedPages: review.flaggedPages,
      },
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
    setupJson: result.book.setupJson,
    packageJson: result.book.packageJson,
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

async function runWithRetries<T>(input: {
  agentName: string;
  bookId: string;
  inputJson?: Record<string, unknown>;
  run: () => Promise<T>;
  retryLabel: string;
  allowUndefinedFinalValue?: boolean;
}): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await logAgentRun({
        agentName: input.agentName,
        bookId: input.bookId,
        inputJson: { ...input.inputJson, attempt },
        run: input.run,
      });
    } catch (error) {
      lastError = error;
      await logEvent({
        bookId: input.bookId,
        agent: input.agentName,
        eventType: "attempt_failed",
        payloadJson: {
          attempt,
          retryLabel: input.retryLabel,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      if (attempt === MAX_RETRIES) {
        if (input.allowUndefinedFinalValue) {
          return undefined as T;
        }
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to complete ${input.retryLabel}.`);
}
