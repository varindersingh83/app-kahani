import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { promptPath } from "./paths";
import { buildImageQaChecklist } from "./imageQa";
import type { SheetSliceManifestEntry } from "./types";

test("builds a per-panel no-text QA checklist for generated slices", () => {
  const slices: SheetSliceManifestEntry[] = [
    {
      pageNumber: 1,
      row: 1,
      col: 1,
      output: "file:///tmp/pages/01_cover.png",
    },
    {
      pageNumber: 2,
      row: 1,
      col: 2,
      output: "file:///tmp/pages/02_belongs_to.png",
    },
    {
      pageNumber: 5,
      row: 2,
      col: 1,
      output: "file:///tmp/pages/story_page_01.png",
    },
  ];

  const result = buildImageQaChecklist({
    bookId: "book-123",
    sheetImagePath: "/tmp/sheet.png",
    slices,
  });

  assert.equal(result.status, "needs_human_review");
  assert.equal(result.panelChecks[0]?.role, "cover_illustration");
  assert.equal(result.panelChecks[1]?.role, "opening_illustration");
  assert.equal(result.panelChecks[2]?.role, "story_illustration");
  assert.ok(
    result.panelChecks.every((check) =>
      check.criteria.includes("no readable text"),
    ),
  );
});

test("sheet prompt keeps strict no-text guardrails", async () => {
  const prompt = await readFile(promptPath("sheet-master-prompt.txt"), "utf8");

  for (const phrase of [
    "No text is allowed anywhere in the image.",
    "Do not render the title.",
    "Do not render \"The End\".",
    "Do not render any readable or pseudo-readable marks.",
    "All text for the reader is handled by the app UI below the illustration",
    "All characters must remain fully clothed in every panel.",
    "Do not depict bathrooms, bathtubs, toilets, potty scenes",
    "changing clothes",
    "speech bubbles",
    "pseudo-text",
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(phrase)));
  }
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
