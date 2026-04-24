import assert from "node:assert/strict";
import test from "node:test";
import { buildBookSetup, buildStoryPlan } from "./phaseA";
import { buildSheetPlan, getSheetPlacement } from "./sheet";

const setup = buildBookSetup(
  {
    mode: "behavior",
    prompt: "My child is learning to ask for a turn instead of grabbing toys.",
    character: {
      name: "Ava",
      photoUri: "file:///parent/uploads/ava.jpg",
    },
    supportingCharacters: [
      {
        name: "Leo",
        relationship: "little brother",
      },
    ],
  },
  "Keep the story cozy and reassuring.",
);
const storyPlan = buildStoryPlan(setup);

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

test("sheet plan combines the brief into one storyboard-sheet prompt", () => {
  const plan = buildSheetPlan({
    brief: setup.brief,
    characterLock: setup.characterLock,
    pageSlots: setup.pageSlots,
    storyPlan,
  });

  assert.equal(plan.rows, 4);
  assert.equal(plan.cols, 3);
  assert.equal(plan.inset, 12);
  assert.equal(plan.tiles.length, 12);
  assert.match(plan.sheetPrompt, /also return the canonical 12-page story text in structured JSON alongside the image/i);
  assert.match(plan.sheetPrompt, /Canonical page text to keep aligned with the sheet/);
  assert.match(plan.sheetPrompt, /do not include narrative text, page numbers, speech bubbles, captions, watermarks, logos, or extra borders inside the art/i);
  assert.match(plan.sheetPrompt, /Panel 1 \(1x1\)/);
  assert.match(plan.sheetPrompt, /Panel 12 \(4x3\)/);
});

test("sheet prompt follows the master storyboard structure", () => {
  const plan = buildSheetPlan({
    brief: setup.brief,
    characterLock: setup.characterLock,
    pageSlots: setup.pageSlots,
    storyPlan,
  });

  assert.match(plan.sheetPrompt, /watercolor children's storybook illustration/i);
  assert.match(plan.sheetPrompt, /3x4 storyboard grid layout/i);
  assert.match(plan.sheetPrompt, /12 panels total/i);
  assert.match(plan.sheetPrompt, /thin white borders separating each panel/i);
  assert.match(plan.sheetPrompt, /same young child character across all panels/i);
  assert.match(plan.sheetPrompt, /story progression across panels from top left to bottom right/i);
  assert.match(plan.sheetPrompt, /Canonical page text to keep aligned with the sheet/i);
  assert.match(plan.sheetPrompt, /Panel 1 \(1x1\): Page 1:/i);
  assert.match(plan.sheetPrompt, /each panel should use a simple background/i);
  assert.match(plan.sheetPrompt, /do not include narrative text/i);
  assert.match(plan.sheetPrompt, /Negative prompt:/i);
  assert.match(plan.sheetPrompt, /Panel 12 \(4x3\): Page 12:/i);
});
