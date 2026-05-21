import { expect, test } from "@playwright/test";

import { mockBlockedGeneration, mockFailedGeneration } from "./apiMocks";
import { evidenceLabel, saveEvidence } from "./evidence";
import { behaviorPrompts, syntheticFamily } from "./fixtures";
import { addCharacter, generateStory, gotoFreshProfile } from "./helpers";

test(`${evidenceLabel(["UF-016", "UF-042"])} guardrail-blocked prompts show a parent-visible safety message`, async ({
  page,
}, testInfo) => {
  const blockedMessage =
    "Kahani cannot create a story from this request. Please contact a trusted professional for urgent safety concerns.";
  await mockBlockedGeneration(page, blockedMessage);
  await gotoFreshProfile(page);
  await addCharacter(page, syntheticFamily.primaryChild, "child");

  await generateStory(page, behaviorPrompts.highRisk);

  await expect(page.getByTestId("generation-error")).toContainText(
    /cannot create a story|trusted professional/i,
  );
  await saveEvidence(page, testInfo, "UF-016-UF-042");
});

test(`${evidenceLabel(["UF-017", "UF-025", "UF-043"])} failed generation leaves the parent on Create Story for retry`, async ({
  page,
}, testInfo) => {
  await mockFailedGeneration(
    page,
    "The story service could not finish. Try again in a moment.",
  );
  await gotoFreshProfile(page);
  await addCharacter(page, syntheticFamily.primaryChild, "child");

  await generateStory(page, behaviorPrompts.promptInjection);

  await expect(page.getByTestId("generation-error")).toContainText(
    /try again/i,
  );
  await expect(page.getByTestId("generate-book-button")).toBeEnabled();
  await saveEvidence(page, testInfo, "UF-017-UF-025-UF-043");
});
