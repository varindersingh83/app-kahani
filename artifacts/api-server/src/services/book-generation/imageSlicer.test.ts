import assert from "node:assert/strict";
import test from "node:test";
import { buildSheetSlicePlan } from "./imageSlicer";

test("sheet slice plan preserves page order and 3x4 naming", () => {
  const plan = buildSheetSlicePlan({
    sourceName: "storyboard-sheet.png",
    outputRoot: "/tmp/kahani-storyboard-slices",
  });

  assert.equal(plan.rows, 4);
  assert.equal(plan.cols, 3);
  assert.equal(plan.entries.length, 12);
  assert.deepEqual(plan.entries[0], {
    pageNumber: 1,
    row: 1,
    col: 1,
    source: "",
    output: "/tmp/kahani-storyboard-slices/page-01.png",
  });
  assert.deepEqual(plan.entries[11], {
    pageNumber: 12,
    row: 4,
    col: 3,
    source: "",
    output: "/tmp/kahani-storyboard-slices/page-12.png",
  });
});
