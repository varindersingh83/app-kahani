import { expect, test } from "@playwright/test";

import { evidenceLabel, saveEvidence } from "./evidence";
import { behaviorPrompts } from "./fixtures";
import {
  declineAppConsent,
  gotoFreshProfile,
  gotoProfileWithoutConsent,
  openCharactersTab,
  openLibraryTab,
  uniqueProfile,
} from "./helpers";

test(`${evidenceLabel(["UF-001"])} first launch shows app consent before the tabs`, async ({
  page,
}, testInfo) => {
  await gotoProfileWithoutConsent(page, uniqueProfile("uf-001"));

  await expect(page.getByText("Kahani privacy consent")).toBeVisible();
  await expect(
    page.getByText(/Family photos stay on this device/),
  ).toBeVisible();
  await expect(page.getByText("I consent", { exact: true })).toBeVisible();
  await saveEvidence(page, testInfo, "UF-001");
});

test(`${evidenceLabel(["UF-001"])} declined app consent keeps normal app hidden`, async ({
  page,
}, testInfo) => {
  await gotoProfileWithoutConsent(page, uniqueProfile("uf-001-decline"));
  await declineAppConsent(page);

  await expect(
    page.getByText(/Consent is required to use Kahani/),
  ).toBeVisible();
  await expect(page.getByText("Choose a character")).toHaveCount(0);
  await saveEvidence(page, testInfo, "UF-001-declined");
});

test(`${evidenceLabel(["UF-003"])} parent can move between Create Story, Characters, and Library`, async ({
  page,
}, testInfo) => {
  await gotoFreshProfile(page);

  await openCharactersTab(page);
  await openLibraryTab(page);
  await page.getByRole("tab", { name: /Create/ }).click();

  await expect(page.getByText("Choose a character")).toBeVisible();
  await saveEvidence(page, testInfo, "UF-003");
});

test(`${evidenceLabel(["UF-004"])} generating with no child routes parent to add a character`, async ({
  page,
}, testInfo) => {
  page.on("dialog", (dialog) => dialog.accept());
  await gotoFreshProfile(page);

  await page.getByTestId("story-prompt-input").fill(behaviorPrompts.bedtime);
  await page.getByTestId("generate-book-button").click();

  await expect(page.getByTestId("character-name-input")).toBeVisible();
  await saveEvidence(page, testInfo, "UF-004");
});
