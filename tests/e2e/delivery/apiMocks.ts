import type { Page, Route } from "@playwright/test";

import { defaultStory } from "./fixtures";

export type GenerateStoryRequestBody = {
  mode: "behavior" | "random";
  prompt?: string;
  character: {
    name: string;
    appearance?: string;
  };
  externalTextAiConsent?: boolean;
  clarification?: {
    originalPrompt: string;
    answer: string;
  };
  supportingCharacters?: Array<{
    name: string;
    relationship: string;
  }>;
};

type StoryFixture = typeof defaultStory;

type SuccessfulGenerationOptions = {
  story?: StoryFixture;
  issueNotice?: string;
  statusMessages?: string[];
};

type GenerationMock = {
  getRequest: () => GenerateStoryRequestBody | null;
  story: StoryFixture;
};

export async function mockSuccessfulStoryGeneration(
  page: Page,
  options: SuccessfulGenerationOptions = {},
): Promise<GenerationMock> {
  const story = options.story ?? defaultStory;
  const statusMessages = options.statusMessages ?? ["Book is ready"];
  let request: GenerateStoryRequestBody | null = null;
  let statusAttempt = 0;

  await page.route("**/api/stories/generate", async (route) => {
    request = route.request().postDataJSON() as GenerateStoryRequestBody;
    await fulfillJson(route, {
      bookId: story.bookId,
      status: "queued",
      step: "queued",
      message: "Waiting to start",
      issueNotice: options.issueNotice,
      behaviorFocus: {
        categoryId: "delivery-sharing",
        scene: "playroom",
        visibleBehavior: "Riley has a hard time sharing blocks.",
        mechanism: "transition stress",
        strategy: "name the feeling and offer a turn plan",
        childStorySkill: "taking turns",
        parentGuidance: "Pause and describe the next small step.",
        targetOutcome: "Riley tries one shareable action.",
        storyFocusLabel: "Taking turns with support",
      },
      parentNote: "Try naming the feeling before giving the next step.",
      classification: {
        categoryId: "delivery-sharing",
        scene: "playroom",
        visibleBehavior: "Riley has a hard time sharing blocks.",
        mechanism: "transition stress",
        strategy: "name the feeling and offer a turn plan",
        childStorySkill: "taking turns",
        parentGuidance: "Pause and describe the next small step.",
        targetOutcome: "Riley tries one shareable action.",
        storyFocusLabel: "Taking turns with support",
      },
    });
  });

  await page.route(`**/api/stories/${story.bookId}/status`, async (route) => {
    const finalAttempt = statusAttempt >= statusMessages.length - 1;
    const message =
      statusMessages[Math.min(statusAttempt, statusMessages.length - 1)];
    statusAttempt += 1;
    await fulfillJson(route, {
      bookId: story.bookId,
      status: finalAttempt ? "complete" : "running",
      step: finalAttempt ? "complete" : "writing",
      message,
    });
  });

  await page.route(`**/api/stories/${story.bookId}`, async (route) => {
    await fulfillJson(route, generatedStoryBody(story));
  });

  return {
    getRequest: () => request,
    story,
  };
}

export async function mockClarificationResponse(page: Page, question: string) {
  let request: GenerateStoryRequestBody | null = null;
  await page.route("**/api/stories/generate", async (route) => {
    request = route.request().postDataJSON() as GenerateStoryRequestBody;
    await fulfillJson(route, {
      status: "needs_clarification",
      clarification: {
        question,
        choices: ["At bedtime", "During cleanup", "With a sibling"],
      },
    });
  });

  return { getRequest: () => request };
}

export async function mockConsentThenSuccessfulGeneration(
  page: Page,
  options: SuccessfulGenerationOptions = {},
): Promise<GenerationMock & { getAttempts: () => number }> {
  const story = options.story ?? defaultStory;
  let attempts = 0;
  let request: GenerateStoryRequestBody | null = null;

  await page.route("**/api/stories/generate", async (route) => {
    attempts += 1;
    request = route.request().postDataJSON() as GenerateStoryRequestBody;
    if (attempts === 1) {
      await fulfillJson(
        route,
        {
          code: "external_text_ai_consent_required",
          error: "External text AI consent is required.",
        },
        403,
      );
      return;
    }
    await fulfillJson(route, {
      bookId: story.bookId,
      status: "queued",
      step: "queued",
      message: "Waiting to start",
    });
  });

  await page.route(`**/api/stories/${story.bookId}/status`, async (route) => {
    await fulfillJson(route, {
      bookId: story.bookId,
      status: "complete",
      step: "complete",
      message: "Book is ready",
    });
  });

  await page.route(`**/api/stories/${story.bookId}`, async (route) => {
    await fulfillJson(route, generatedStoryBody(story));
  });

  return {
    getRequest: () => request,
    getAttempts: () => attempts,
    story,
  };
}

export async function mockBlockedGeneration(page: Page, message: string) {
  await page.route("**/api/stories/generate", async (route) => {
    await fulfillJson(
      route,
      { code: "guardrail_blocked", error: message },
      400,
    );
  });
}

export async function mockFailedGeneration(page: Page, message: string) {
  await page.route("**/api/stories/generate", async (route) => {
    await fulfillJson(route, {
      bookId: "delivery-failed-book",
      status: "queued",
      step: "queued",
      message: "Waiting to start",
    });
  });

  await page.route(
    "**/api/stories/delivery-failed-book/status",
    async (route) => {
      await fulfillJson(route, {
        bookId: "delivery-failed-book",
        status: "failed",
        step: "failed",
        message,
        error: message,
      });
    },
  );
}

function generatedStoryBody(story: StoryFixture) {
  return {
    title: story.title,
    child_name: story.childName,
    reflectionQuestion: story.reflectionQuestion,
    coverImageUrl: "",
    endImageUrl: "",
    pages: story.pages,
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}
