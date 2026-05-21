import { expect, test } from "@playwright/test";

import {
  mockClarificationResponse,
  mockConsentThenSuccessfulGeneration,
  mockSuccessfulStoryGeneration,
} from "./apiMocks";
import { evidenceLabel, saveEvidence } from "./evidence";
import { behaviorPrompts, syntheticFamily } from "./fixtures";
import { addCharacter, generateStory, gotoFreshProfile } from "./helpers";

test(`${evidenceLabel(["UF-010", "UF-011", "UF-012", "UF-013"])} behavior generation asks consent, shows progress, and opens reader`, async ({
  page,
}, testInfo) => {
  const generation = await mockConsentThenSuccessfulGeneration(page);
  await gotoFreshProfile(page);
  await addCharacter(page, syntheticFamily.primaryChild, "child");

  await generateStory(page, behaviorPrompts.bedtime);

  await expect(page.getByTestId("reader-cover-owner")).toHaveText(
    `A story for ${syntheticFamily.primaryChild}.`,
  );
  expect(generation.getAttempts()).toBe(2);
  expect(generation.getRequest()).toMatchObject({
    mode: "behavior",
    externalTextAiConsent: true,
  });
  await saveEvidence(page, testInfo, "UF-010-UF-011-UF-012-UF-013");
});

test(`${evidenceLabel(["UF-014", "UF-034"])} vague behavior prompts show one clarification question`, async ({
  page,
}, testInfo) => {
  const clarification = await mockClarificationResponse(
    page,
    "What is the clearest thing Riley does at bedtime?",
  );
  await gotoFreshProfile(page);
  await addCharacter(page, syntheticFamily.primaryChild, "child");

  await generateStory(page, behaviorPrompts.vagueBedtime);

  await expect(page.getByText(/clearest thing Riley does/i)).toBeVisible();
  await expect(page.getByText("At bedtime")).toBeVisible();
  expect(clarification.getRequest()).toMatchObject({
    prompt: behaviorPrompts.vagueBedtime,
    character: { name: syntheticFamily.primaryChild },
  });
  await saveEvidence(page, testInfo, "UF-014-UF-034");
});

test(`${evidenceLabel(["UF-015", "UF-026"])} long normal prompts generate without provider-content assertions`, async ({
  page,
}, testInfo) => {
  const generation = await mockSuccessfulStoryGeneration(page, {
    issueNotice: "Kahani focused the story on one teachable behavior.",
  });
  await gotoFreshProfile(page);
  await addCharacter(page, syntheticFamily.primaryChild, "child");

  await generateStory(page, behaviorPrompts.longButNormal);

  await expect(page.getByTestId("reader-cover-owner")).toHaveText(
    `A story for ${syntheticFamily.primaryChild}.`,
  );
  expect(generation.getRequest()?.prompt).toBe(behaviorPrompts.longButNormal);
  await saveEvidence(page, testInfo, "UF-015-UF-026");
});
