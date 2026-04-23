import assert from "node:assert/strict";
import test from "node:test";
import { buildSheetPlan, getSheetPlacement } from "./sheet";
import type { CharacterLock, StorySetup } from "./types";

const characterLock: CharacterLock = {
  name: "Ava",
  appearance: "consistent child appearance based on the uploaded reference photo",
  stylePrompt:
    "Ava appears consistently throughout: consistent child appearance based on the uploaded reference photo. Warm watercolor children's book style, soft pastel palette.",
  negativePrompt:
    "No scary imagery, no harsh lighting, no inconsistent character traits, no text in image.",
};

const setup: StorySetup = {
  spine: {
    beginning: "Ava starts in a gentle moment.",
    middle: "Ava practices a brave request.",
    ending: "Ava ends proud and connected.",
    emotionalArc: "curious to challenged to confident",
  },
  storyboard: Array.from({ length: 12 }, (_, index) => {
    const pageNumber = index + 1;
    const placement = getSheetPlacement(pageNumber);
    return {
      pageNumber,
      beat: `Page ${pageNumber} beat`,
      visualFocus: `Visual focus ${pageNumber}`,
      emotion: pageNumber === 12 ? "proud" : "curious",
      sheetPlacement: placement,
    };
  }),
  characterLock,
};

test("sheet placement maps each page into the 3x4 grid", () => {
  assert.deepEqual(getSheetPlacement(1), {
    pageNumber: 1,
    row: 1,
    col: 1,
    panelLabel: "Panel 1 (1x1)",
  });
  assert.deepEqual(getSheetPlacement(12), {
    pageNumber: 12,
    row: 4,
    col: 3,
    panelLabel: "Panel 12 (4x3)",
  });
});

test("sheet plan combines all 12 storyboard beats into one composite art prompt", () => {
  const plan = buildSheetPlan({
    story: {
      title: "Ava Waits",
      reflectionQuestion: "What can Ava say?",
      pages: setup.storyboard.map((beat) => ({
        pageNumber: beat.pageNumber,
        text: beat.beat,
        illustrationPrompt: beat.visualFocus,
      })),
    },
    setup,
    characterLock,
  });

  assert.equal(plan.rows, 4);
  assert.equal(plan.cols, 3);
  assert.equal(plan.inset, 12);
  assert.equal(plan.tiles.length, 12);
  assert.match(plan.sheetPrompt, /3-column by 4-row grid/);
  assert.match(plan.sheetPrompt, /This single sheet will later be sliced into 12 individual page images/);
  assert.match(plan.sheetPrompt, /Panel 1 \(1x1\)/);
  assert.match(plan.sheetPrompt, /Panel 12 \(4x3\)/);
});
