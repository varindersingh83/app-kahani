import { expect, test } from "@playwright/test";

import { mockConsentThenSuccessfulGeneration } from "./delivery/apiMocks";
import { defaultStory } from "./delivery/fixtures";
import {
  addCharacter,
  generateStory,
  gotoFreshProfile,
  saveCurrentStoryToLibrary,
} from "./delivery/helpers";

test("adds child, mom, and dad, creates a story with correct names, and saves it in Library", async ({
  page,
}) => {
  const generation = await mockConsentThenSuccessfulGeneration(page, {
    story: {
      ...defaultStory,
      bookId: "e2e-book-1",
      title: "Liam and the Rainy Window",
      childName: "Liam",
      reflectionQuestion: "What did Liam like doing with Maya and Noah?",
      pages: [
        {
          pageNumber: 1,
          text: "Liam looked at the rainy window. Maya sat beside him, and Noah held the red umbrella.",
          illustrationPrompt:
            "Liam, Maya, and Noah near a rainy window with a red umbrella.",
        },
        {
          pageNumber: 2,
          text: "Liam smiled. Maya waved, and Noah opened the door for a tiny puddle walk.",
          illustrationPrompt:
            "Liam, Maya, and Noah going outside for a small puddle walk.",
        },
      ],
    },
  });

  await gotoFreshProfile(page);

  await addCharacter(page, "Liam", "child");
  await addCharacter(page, "Maya", "mom");
  await addCharacter(page, "Noah", "dad");

  await page.getByTestId("story-character-Liam").click();
  await generateStory(page, "rainy day disappointment with Mom and Dad nearby");

  await expect(page.getByTestId("reader-cover-owner")).toHaveText(
    "A story for Liam.",
  );

  expect(generation.getRequest()).toMatchObject({
    mode: "behavior",
    prompt: "rainy day disappointment with Mom and Dad nearby",
    character: { name: "Liam" },
    externalTextAiConsent: true,
  });
  expect(generation.getRequest()?.supportingCharacters).toEqual(
    expect.arrayContaining([
      { name: "Maya", relationship: "mom" },
      { name: "Noah", relationship: "dad" },
    ]),
  );
  expect(generation.getRequest()?.supportingCharacters).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ name: "Liam" })]),
  );

  await page.getByTestId("reader-nav-right").click();
  await expect(page.getByTestId("reader-page-1-text")).toContainText("Liam");
  await expect(page.getByTestId("reader-page-1-text")).toContainText("Maya");
  await expect(page.getByTestId("reader-page-1-text")).toContainText("Noah");
  await expect(page.getByText(/Leo/)).toHaveCount(0);

  await saveCurrentStoryToLibrary(page);

  await page.getByTestId("reader-back-button").click();
  await expect(page.getByText("Choose a character")).toBeVisible();
  await page.getByRole("tab", { name: /Library/ }).click();
  await expect(page.getByTestId("library-featured-story")).toContainText(
    generation.story.title,
  );
  await expect(
    page.getByTestId(`library-story-${generation.story.title}`),
  ).toContainText(generation.story.title);
});
