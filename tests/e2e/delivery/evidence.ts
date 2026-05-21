import type { Page, TestInfo } from "@playwright/test";

export async function saveEvidence(
  page: Page,
  testInfo: TestInfo,
  ufId: string,
) {
  const path = testInfo.outputPath(`${ufId}.png`);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(`${ufId} screenshot`, {
    path,
    contentType: "image/png",
  });
}

export function evidenceLabel(ufIds: string[]) {
  return `[${ufIds.join(", ")}]`;
}
