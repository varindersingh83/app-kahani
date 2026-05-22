import { expect, type Page } from "@playwright/test";

export type CharacterRelationship = "child" | "mom" | "dad";

const dialogReadyPages = new WeakSet<Page>();

export function uniqueProfile(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function gotoFreshProfile(
  page: Page,
  profile = uniqueProfile("uf"),
) {
  await page.goto(`/?profile=${profile}&e2eConsent=accepted`);
  await acceptAppConsentIfShown(page);
  await expect(page.getByText("Choose a character")).toBeVisible();
  return profile;
}

export async function gotoProfileWithoutConsent(
  page: Page,
  profile = uniqueProfile("uf-consent"),
) {
  await page.goto(`/?profile=${profile}`);
  await expect(page.getByText("Kahani privacy consent")).toBeVisible();
  return profile;
}

export async function acceptAppConsentIfShown(page: Page) {
  const consentTitle = page.getByText("Kahani privacy consent");
  if (await consentTitle.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await page.getByTestId("app-consent-accept-button").click();
  }
}

export async function declineAppConsent(page: Page) {
  await page.getByTestId("app-consent-decline-button").click();
}

export async function addCharacter(
  page: Page,
  name: string,
  relationship: CharacterRelationship,
) {
  await page.getByTestId("add-character-shortcut").click();
  await expect(page.getByTestId("character-name-input")).toBeVisible();
  await page.getByTestId(`relationship-${relationship}`).click();
  await page.getByTestId("character-name-input").fill(name);
  await page.getByTestId("save-character-button").click();
  await expect(page.getByText("Choose a character")).toBeVisible();
}

export async function openCharactersTab(page: Page) {
  await page.getByRole("tab", { name: /Add character/ }).click();
  await expect(page.getByTestId("character-name-input")).toBeVisible();
}

export async function openLibraryTab(page: Page) {
  await page.getByRole("tab", { name: /Library/ }).click();
  await expect(page.getByText("All books")).toBeVisible();
}

export async function generateStory(page: Page, prompt: string) {
  acceptDialogs(page);
  await page.getByTestId("story-prompt-input").fill(prompt);
  await page.getByTestId("generate-book-button").click();
}

function acceptDialogs(page: Page) {
  if (dialogReadyPages.has(page)) return;
  dialogReadyPages.add(page);
  page.on("dialog", (dialog) => dialog.accept());
}

export async function saveCurrentStoryToLibrary(page: Page) {
  await page.getByTestId("reader-nav-right").click();
  await page.getByTestId("reader-nav-right").click();
  await page.getByTestId("reader-nav-right").click();
  const saveButton = page.getByTestId("save-to-library-button");
  await expect(saveButton).toContainText(/Save(d)? to library/);
  if (!((await saveButton.textContent()) ?? "").includes("Saved to library")) {
    await saveButton.click();
  }
  await expect(saveButton).toContainText("Saved to library");
}
