import { expect, test } from "@playwright/test";

import { evidenceLabel, saveEvidence } from "./evidence";
import { gotoFreshProfile, openCharactersTab, openLibraryTab } from "./helpers";

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 900 },
]) {
  test(`${evidenceLabel(["UF-027", "UF-028", "UF-029"])} ${viewport.name} viewport renders primary surfaces without overlap smoke`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await gotoFreshProfile(page, `uf-layout-${viewport.name}`);

    await expect(page.getByText("Choose a character")).toBeVisible();
    await openCharactersTab(page);
    await openLibraryTab(page);
    await saveEvidence(page, testInfo, `UF-027-UF-028-UF-029-${viewport.name}`);
  });
}

test(`${evidenceLabel(["UF-040", "UF-046", "UF-047", "UF-048"])} theme, labels, and sample Library smoke`, async ({
  page,
}, testInfo) => {
  await gotoFreshProfile(page);

  await page.getByLabel("Toggle theme").first().click();
  await expect(page.getByText("Choose a character")).toBeVisible();
  await openCharactersTab(page);
  await expect(page.getByTestId("character-name-input")).toBeVisible();
  await openLibraryTab(page);
  await expect(page.getByText("All books")).toBeVisible();
  await saveEvidence(page, testInfo, "UF-040-UF-046-UF-047-UF-048");
});
