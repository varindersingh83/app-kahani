import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const screenSource = fs.readFileSync(
  path.join(process.cwd(), "artifacts/mobile/app/(tabs)/index.tsx"),
  "utf8",
);

test("Create Story keeps the parent flow to one prompt input and one generate action", () => {
  assert.match(screenSource, /What should the story help with\?/);
  assert.match(screenSource, /Generate book/);
  assert.doesNotMatch(screenSource, /Tell me what is happening with your child/);
  assert.doesNotMatch(screenSource, /Story focus:/);
  assert.doesNotMatch(screenSource, /generation-error/);
});

test("Create Story no longer sends clarification answers from the prompt composer", () => {
  assert.doesNotMatch(screenSource, /clarification:\s*\{/);
  assert.doesNotMatch(screenSource, /appendClarificationMessages/);
  assert.doesNotMatch(screenSource, /buildInitialStoryChat/);
  assert.doesNotMatch(screenSource, /appendFocusMessages/);
});
