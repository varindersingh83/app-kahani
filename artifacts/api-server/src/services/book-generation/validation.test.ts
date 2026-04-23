import assert from "node:assert/strict";
import test from "node:test";
import { scoreAlignment, selectBestCandidate, validatePage, validateStory } from "./validation";

test("validatePage reports deterministic prompt and text failures", () => {
  const result = validatePage({
    pageNumber: 1,
    text: "One. Two. Three. Four.",
    illustrationPrompt: "A bright garden scene",
  });

  assert.equal(result.ok, false);
  assert.match(result.failures.join("\n"), /1-3 short sentences/);
  assert.match(result.failures.join("\n"), /watercolor style/);
});

test("validateStory catches missing pages", () => {
  const result = validateStory({
    title: "Tiny Test",
    reflectionQuestion: "What felt kind?",
    pages: [
      {
        pageNumber: 1,
        text: "Mia smiles.",
        illustrationPrompt: "Warm watercolor scene with Mia smiling.",
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.match(result.failures.join("\n"), /expected 12 pages/);
  assert.match(result.failures.join("\n"), /missing page 12/);
});

test("alignment scoring rewards child name and watercolor consistency", () => {
  const score = scoreAlignment(
    {
      pageNumber: 1,
      text: "Mia feels calm and proud.",
      illustrationPrompt: "Warm watercolor scene of Mia in a soft blue sweater.",
    },
    "Mia",
  );

  assert.ok(score >= 0.9);
});

test("selectBestCandidate chooses the highest-scoring retry candidate", () => {
  const selected = selectBestCandidate([
    {
      pageNumber: 1,
      text: "Mia tries again.",
      illustrationPrompt: "Watercolor scene with Mia.",
      alignmentScore: 0.71,
    },
    {
      pageNumber: 1,
      text: "Mia smiles softly.",
      illustrationPrompt: "Warm watercolor scene with Mia.",
      alignmentScore: 0.95,
    },
  ]);

  assert.equal(selected?.alignmentScore, 0.95);
  assert.equal(selected?.text, "Mia smiles softly.");
});
