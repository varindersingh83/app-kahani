import assert from "node:assert/strict";
import test from "node:test";
import { buildBookSetup } from "./phaseA";
import { buildCoverPrompt, buildStoryboardSheetPlan, buildStoryboardSheetPrompt } from "./phaseB";
import { buildSheetPlan } from "./sheet";

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
  "Keep the tone calm and cozy.",
);

test("Phase B cover prompt includes the image brief and character lock", () => {
  const prompt = buildCoverPrompt({
    brief: setup.brief,
    characterLock: setup.characterLock,
  });

  assert.match(prompt, /watercolor children's picture-book cover illustration/i);
  assert.match(prompt, /No text on the image/);
  assert.match(prompt, /Child: Ava/);
  assert.match(prompt, /Keep the tone calm and cozy/);
  assert.match(prompt, /Negative prompt:/);
});

test("Phase B storyboard prompt builds a 3x4 sheet brief with page slots", () => {
  const prompt = buildStoryboardSheetPrompt({
    brief: setup.brief,
    characterLock: setup.characterLock,
    pageSlots: setup.pageSlots,
  });

  assert.match(prompt, /3x4 storyboard grid layout/);
  assert.match(prompt, /12 panels total/);
  assert.match(prompt, /thin white borders separating each panel/);
  assert.match(prompt, /Panel 1 \(1x1\)/);
  assert.match(prompt, /Panel 12 \(4x3\)/);
  assert.match(prompt, /canonical 12-page story text in structured JSON/i);
});

test("Phase B storyboard sheet plan preserves the deterministic page map", () => {
  const plan = buildStoryboardSheetPlan({
    brief: setup.brief,
    characterLock: setup.characterLock,
    pageSlots: setup.pageSlots,
  });

  assert.equal(plan.rows, 4);
  assert.equal(plan.cols, 3);
  assert.equal(plan.inset, 12);
  assert.equal(plan.tiles.length, 12);
  assert.equal(plan.tiles[0]?.pageNumber, 1);
  assert.equal(plan.tiles[11]?.pageNumber, 12);
  assert.match(plan.sheetPrompt, /do not include narrative text/i);
  assert.match(plan.sheetPrompt, /story progression across panels from top left to bottom right/i);
  assert.match(plan.sheetPrompt, /canonical 12-page story text in structured JSON/i);
});

test("Sheet helper still emits a deterministic 3x4 grid prompt", () => {
  const plan = buildSheetPlan({
    brief: setup.brief,
    characterLock: setup.characterLock,
    pageSlots: setup.pageSlots,
  });

  assert.equal(plan.tiles.length, 12);
  assert.match(plan.sheetPrompt, /the image must be a single 3x4 storyboard sheet that can be sliced into 12 page images/i);
  assert.match(plan.sheetPrompt, /Panel 1 \(1x1\):/);
  assert.match(plan.sheetPrompt, /Panel 12 \(4x3\):/);
  assert.match(plan.tiles[0]!.beat, /Ava is introduced/);
});
