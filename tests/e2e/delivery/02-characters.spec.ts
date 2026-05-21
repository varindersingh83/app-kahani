import { expect, test } from "@playwright/test";

import { mockSuccessfulStoryGeneration } from "./apiMocks";
import { evidenceLabel, saveEvidence } from "./evidence";
import { behaviorPrompts, syntheticFamily } from "./fixtures";
import {
  addCharacter,
  generateStory,
  gotoFreshProfile,
  openCharactersTab,
} from "./helpers";

test(`${evidenceLabel(["UF-005", "UF-031", "UF-032"])} child creation without a real photo appears in Characters and Create Story`, async ({
  page,
}, testInfo) => {
  await gotoFreshProfile(page);

  await addCharacter(page, syntheticFamily.primaryChild, "child");

  await expect(
    page.getByTestId(`story-character-${syntheticFamily.primaryChild}`),
  ).toBeVisible();
  await openCharactersTab(page);
  await expect(
    page.getByTestId(`saved-character-${syntheticFamily.primaryChild}`),
  ).toBeVisible();
  await expect(
    page.getByText(
      /photo is processed on this device|photo cannot be read locally/i,
    ),
  ).toBeVisible();
  await saveEvidence(page, testInfo, "UF-005-UF-031-UF-032");
});

test(`${evidenceLabel(["UF-006", "UF-007", "UF-033"])} parent characters are supporting cast and not the main child`, async ({
  page,
}, testInfo) => {
  const generation = await mockSuccessfulStoryGeneration(page);
  await gotoFreshProfile(page);

  await addCharacter(page, syntheticFamily.primaryChild, "child");
  await addCharacter(page, syntheticFamily.mom, "mom");
  await addCharacter(page, syntheticFamily.dad, "dad");
  await page
    .getByTestId(`story-character-${syntheticFamily.primaryChild}`)
    .click();
  await generateStory(page, behaviorPrompts.sharing);

  await expect(page.getByTestId("reader-cover-owner")).toHaveText(
    `A story for ${syntheticFamily.primaryChild}.`,
  );
  expect(generation.getRequest()).toMatchObject({
    character: { name: syntheticFamily.primaryChild },
  });
  expect(generation.getRequest()?.supportingCharacters).toEqual(
    expect.arrayContaining([
      { name: syntheticFamily.mom, relationship: "mom" },
      { name: syntheticFamily.dad, relationship: "dad" },
    ]),
  );
  await saveEvidence(page, testInfo, "UF-006-UF-007-UF-033");
});

test(`${evidenceLabel(["UF-008", "UF-009"])} multiple children and long synthetic names remain selectable`, async ({
  page,
}, testInfo) => {
  await gotoFreshProfile(page);

  await addCharacter(page, syntheticFamily.primaryChild, "child");
  await addCharacter(page, syntheticFamily.secondChild, "child");
  await addCharacter(page, syntheticFamily.longName, "child");

  await expect(
    page.getByTestId(`story-character-${syntheticFamily.primaryChild}`),
  ).toBeVisible();
  await expect(
    page.getByTestId(`story-character-${syntheticFamily.secondChild}`),
  ).toBeVisible();
  await expect(
    page.getByTestId(`story-character-${syntheticFamily.longName}`),
  ).toBeVisible();
  await page
    .getByTestId(`story-character-${syntheticFamily.secondChild}`)
    .click();
  await saveEvidence(page, testInfo, "UF-008-UF-009");
});
