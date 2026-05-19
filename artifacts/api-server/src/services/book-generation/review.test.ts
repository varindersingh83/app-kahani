import assert from "node:assert/strict";
import test from "node:test";
import { reviewStoryPages } from "./review";
import type { SheetSliceManifestEntry, StoryPlanPage } from "./types";

const pages: StoryPlanPage[] = Array.from({ length: 12 }, (_, index) => {
  const pageNumber = index + 1;
  return {
    pageNumber,
    text:
      pageNumber === 1
        ? "Ava starts with a small feeling and notices the toy."
        : `Ava page ${pageNumber}.`,
    illustrationPrompt: `Page ${pageNumber}: watercolor scene of Ava, sharing toys, Panel ${pageNumber} (1x1), consistent outfit, warm emotional storytelling`,
    sheetPlacement: {
      pageNumber,
      row: Math.floor(index / 3) + 1,
      col: (index % 3) + 1,
      panelLabel: `Panel ${pageNumber} (${Math.floor(index / 3) + 1}x${(index % 3) + 1})`,
    },
    beat: `Beat ${pageNumber}`,
    visualFocus: `Focus ${pageNumber}`,
    emotion: pageNumber === 12 ? "proud" : "gentle",
  };
});

const slices: SheetSliceManifestEntry[] = Array.from({ length: 12 }, (_, index) => ({
  pageNumber: index + 1,
  row: Math.floor(index / 3) + 1,
  col: (index % 3) + 1,
  source: `file:///tmp/sheet.png`,
  output: `file:///tmp/page-${index + 1}.png`,
  crop: {
    left: 0,
    top: 0,
    right: 100,
    bottom: 100,
  },
}));

test("review pass rewrites weak page text and preserves slice ordering", () => {
  const review = reviewStoryPages({
    childName: "Ava",
    pages,
    slices,
  });

  assert.equal(review.pages.length, 12);
  assert.equal(review.flaggedPages.length, 0);
  assert.equal(review.shouldEscalate, false);
  assert.match(review.pages[1]!.text, /Ava notices/);
  assert.ok(review.pages.every((page) => typeof page.alignmentScore === "number"));
});

test("review pass flags pages when the slice is missing", () => {
  const review = reviewStoryPages({
    childName: "Ava",
    pages,
    slices: slices.slice(0, 11),
  });

  assert.equal(review.shouldEscalate, true);
  assert.deepEqual(review.flaggedPages, [12]);
  assert.equal(review.pages[11]?.flagForHuman, true);
});
