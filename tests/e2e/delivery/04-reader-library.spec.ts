import { expect, test } from "@playwright/test";

import { mockSuccessfulStoryGeneration } from "./apiMocks";
import { evidenceLabel, saveEvidence } from "./evidence";
import { alternateStory, behaviorPrompts, syntheticFamily } from "./fixtures";
import {
  addCharacter,
  generateStory,
  gotoFreshProfile,
  openLibraryTab,
  saveCurrentStoryToLibrary,
  uniqueProfile,
} from "./helpers";

test(`${evidenceLabel(["UF-018", "UF-019", "UF-020", "UF-021", "UF-022"])} reader pages navigate and save into Library`, async ({
  page,
}, testInfo) => {
  const generation = await mockSuccessfulStoryGeneration(page);
  await gotoFreshProfile(page);
  await addCharacter(page, syntheticFamily.primaryChild, "child");

  await generateStory(page, behaviorPrompts.sharing);

  await expect(page.getByTestId("reader-cover-owner")).toHaveText(
    `A story for ${syntheticFamily.primaryChild}.`,
  );
  await page.getByTestId("reader-nav-right").click();
  await expect(page.getByTestId("reader-page-1-text")).toContainText(
    syntheticFamily.primaryChild,
  );
  await saveCurrentStoryToLibrary(page);

  await page.getByTestId("reader-back-button").click();
  await openLibraryTab(page);
  await expect(page.getByTestId("library-featured-story")).toContainText(
    generation.story.title,
  );
  await saveEvidence(page, testInfo, "UF-018-UF-019-UF-020-UF-021-UF-022");
});

test(`${evidenceLabel(["UF-023", "UF-024", "UF-035"])} saved story reopens from Library and can be deleted`, async ({
  page,
}, testInfo) => {
  const generation = await mockSuccessfulStoryGeneration(page, {
    story: alternateStory,
  });
  await gotoFreshProfile(page);
  await addCharacter(page, syntheticFamily.secondChild, "child");
  await page
    .getByTestId(`story-character-${syntheticFamily.secondChild}`)
    .click();
  await generateStory(page, behaviorPrompts.sharing);
  await saveCurrentStoryToLibrary(page);

  await page.getByTestId("reader-back-button").click();
  await openLibraryTab(page);
  await page.getByTestId(`library-story-${generation.story.title}`).click();
  await expect(page.getByTestId("reader-cover-owner")).toHaveText(
    `A story for ${syntheticFamily.secondChild}.`,
  );
  await page.getByTestId("reader-back-button").click();
  await page
    .getByRole("button", { name: `Delete ${generation.story.title}` })
    .click();
  await expect(
    page.getByTestId(`library-story-${generation.story.title}`),
  ).toHaveCount(0);
  await saveEvidence(page, testInfo, "UF-023-UF-024-UF-035");
});

test(`${evidenceLabel(["UF-036", "UF-037", "UF-038", "UF-039"])} profile storage keeps family libraries separated`, async ({
  page,
}, testInfo) => {
  const profileA = uniqueProfile("uf-library-a");
  const profileB = uniqueProfile("uf-library-b");
  await gotoFreshProfile(page, profileA);
  await addCharacter(page, syntheticFamily.primaryChild, "child");

  await gotoFreshProfile(page, profileB);
  await expect(
    page.getByTestId(`story-character-${syntheticFamily.primaryChild}`),
  ).toHaveCount(0);

  await gotoFreshProfile(page, profileA);
  await expect(
    page.getByTestId(`story-character-${syntheticFamily.primaryChild}`),
  ).toBeVisible();
  await saveEvidence(page, testInfo, "UF-036-UF-037-UF-038-UF-039");
});
