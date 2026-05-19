import { expect, test, type Page } from "@playwright/test";

type GenerateStoryRequestBody = {
  mode: "behavior" | "random";
  prompt?: string;
  character: {
    name: string;
    appearance?: string;
  };
  externalTextAiConsent?: boolean;
  supportingCharacters?: Array<{
    name: string;
    relationship: string;
  }>;
};

const storyTitle = "Liam and the Rainy Window";

test("adds child, mom, and dad, creates a story with correct names, and saves it in Library", async ({
  page,
}) => {
  let generateRequest: GenerateStoryRequestBody | null = null;

  await page.route("**/api/stories/generate", async (route) => {
    generateRequest = route.request().postDataJSON() as GenerateStoryRequestBody;
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({
        bookId: "e2e-book-1",
        status: "queued",
        step: "queued",
        message: "Waiting to start",
      }),
    });
  });

  await page.route("**/api/stories/e2e-book-1/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        bookId: "e2e-book-1",
        status: "complete",
        step: "complete",
        message: "Book is ready",
      }),
    });
  });

  await page.route("**/api/stories/e2e-book-1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        title: storyTitle,
        child_name: "Liam",
        reflectionQuestion: "What did Liam like doing with Maya and Noah?",
        coverImageUrl: "",
        endImageUrl: "",
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
      }),
    });
  });

  const profile = `e2e-${Date.now()}`;
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(`/?profile=${profile}`);
  await expect(page.getByText("Choose a character")).toBeVisible();

  await addCharacter(page, "Liam", "child");
  await addCharacter(page, "Maya", "mom");
  await addCharacter(page, "Noah", "dad");

  await page.getByTestId("story-character-Liam").click();
  await page
    .getByTestId("story-prompt-input")
    .fill("rainy day disappointment with Mom and Dad nearby");
  await page.getByTestId("generate-book-button").click();

  await expect(page.getByTestId("reader-cover-owner")).toHaveText(
    "A story for Liam.",
  );

  expect(generateRequest).toMatchObject({
    mode: "behavior",
    prompt: "rainy day disappointment with Mom and Dad nearby",
    character: { name: "Liam" },
    externalTextAiConsent: true,
  });
  expect(generateRequest?.supportingCharacters).toEqual(
    expect.arrayContaining([
      { name: "Maya", relationship: "mom" },
      { name: "Noah", relationship: "dad" },
    ]),
  );
  expect(generateRequest?.supportingCharacters).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ name: "Liam" })]),
  );

  await page.getByTestId("reader-nav-right").click();
  await expect(page.getByTestId("reader-page-1-text")).toContainText("Liam");
  await expect(page.getByTestId("reader-page-1-text")).toContainText("Maya");
  await expect(page.getByTestId("reader-page-1-text")).toContainText("Noah");
  await expect(page.getByText(/Leo/)).toHaveCount(0);

  await page.getByTestId("reader-nav-right").click();
  await page.getByTestId("reader-nav-right").click();
  await expect(page.getByTestId("save-to-library-button")).toContainText(
    "Saved to library",
  );

  await page.getByTestId("reader-back-button").click();
  await expect(page.getByText("Choose a character")).toBeVisible();
  await page.getByRole("tab", { name: /Library/ }).click();
  await expect(page.getByTestId("library-featured-story")).toContainText(
    storyTitle,
  );
  await expect(page.getByTestId(`library-story-${storyTitle}`)).toContainText(
    storyTitle,
  );
});

async function addCharacter(
  page: Page,
  name: string,
  relationship: "child" | "mom" | "dad",
) {
  await page.getByTestId("add-character-shortcut").click();
  await expect(page.getByTestId("character-name-input")).toBeVisible();
  await page.getByTestId(`relationship-${relationship}`).click();
  await page.getByTestId("character-name-input").fill(name);
  await page.getByTestId("save-character-button").click();
  await expect(page.getByText("Choose a character")).toBeVisible();
}
