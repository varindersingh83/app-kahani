import assert from "node:assert/strict";
import test from "node:test";
import type { CharacterLock, PipelineStoryPage, StorySetup } from "./types";
import {
  runAlignmentAgent,
  runIllustrationAgentV1,
  runIterationController,
  runPageProductionAttempt,
  runPromptBuilderAgent,
  runSheetArtDirectionAgent,
} from "./phaseB";

const characterLock: CharacterLock = {
  name: "Ava",
  appearance: "consistent child appearance based on the uploaded reference photo",
  stylePrompt:
    "Ava appears consistently throughout: consistent child appearance based on the uploaded reference photo. Warm watercolor children's book style, soft pastel palette.",
  negativePrompt:
    "No scary imagery, no harsh lighting, no inconsistent character traits, no text in image.",
};

const storyboardBeat: StorySetup["storyboard"][number] = {
  pageNumber: 3,
  beat: "Ava asks Leo for a turn.",
  visualFocus: "Ava kneels beside Leo and the shiny train.",
  emotion: "calm",
  sheetPlacement: {
    pageNumber: 3,
    row: 1,
    col: 3,
    panelLabel: "Panel 3 (1x3)",
  },
};

const page: PipelineStoryPage = {
  pageNumber: 3,
  text: "Ava asks Leo for a turn.",
  illustrationPrompt: "Warm watercolor scene with Ava and Leo beside the shiny train.",
};

test("Phase B Step 6 PromptBuilderAgent combines page text, storyboard, character lock, and negative prompt", () => {
  const prompt = runPromptBuilderAgent({ page, storyboardBeat, characterLock });

  assert.equal(prompt.pageNumber, 3);
  assert.equal(prompt.text, page.text);
  assert.match(prompt.illustrationPrompt, /Warm watercolor scene with Ava/);
  assert.match(prompt.illustrationPrompt, /Ava appears consistently throughout/);
  assert.match(prompt.illustrationPrompt, /Scene emotion: calm/);
  assert.match(prompt.illustrationPrompt, /Visual focus: Ava kneels beside Leo/);
  assert.match(prompt.illustrationPrompt, /Sheet panel: Panel 3 \(1x3\)/);
  assert.match(prompt.illustrationPrompt, /Negative prompt: No scary imagery/);
});

test("Phase B Step 7 IllustrationAgent v1 returns a structured prompt candidate without generating an image", () => {
  const prompt = runPromptBuilderAgent({ page, storyboardBeat, characterLock });
  const candidate = runIllustrationAgentV1(prompt);

  assert.equal(candidate.pageNumber, page.pageNumber);
  assert.equal(candidate.text, page.text);
  assert.equal(candidate.illustrationPrompt, prompt.illustrationPrompt);
  assert.deepEqual(candidate.sheetPlacement, prompt.sheetPlacement);
});

test("Phase B Step 8 AlignmentAgent accepts a coherent page candidate", () => {
  const alignment = runAlignmentAgent(page, "Ava");

  assert.equal(alignment.ok, true);
  assert.ok(alignment.score >= 0.9);
  assert.deepEqual(alignment.failures, []);
});

test("Phase B Step 8 AlignmentAgent rejects weak or inconsistent prompt candidates", () => {
  const alignment = runAlignmentAgent(
    {
      pageNumber: 3,
      text: "Ava asks Leo for a turn. Then she runs. Then she jumps. Then she shouts.",
      illustrationPrompt: "A train on a table.",
    },
    "Ava",
  );

  assert.equal(alignment.ok, false);
  assert.match(alignment.failures.join("\n"), /1-3 short sentences/);
  assert.match(alignment.failures.join("\n"), /watercolor style/);
  assert.match(alignment.failures.join("\n"), /alignment score/);
});

test("Phase B Step 9 IterationController retries a failing page below the retry cap", () => {
  const decision = runIterationController({
    candidates: [
      {
        ...page,
        illustrationPrompt: "A train on a table.",
        alignmentScore: 0.5,
        retryCount: 1,
        failures: ["illustration prompt must include watercolor style"],
      },
    ],
  });

  assert.equal(decision.status, "retry");
  assert.equal(decision.shouldRetry, true);
  assert.equal(decision.retryCount, 2);
  assert.equal(decision.flagForHuman, false);
});

test("Phase B Step 9 IterationController stops at 3 retries, flags QA, and selects best candidate", () => {
  const decision = runIterationController({
    candidates: [
      {
        ...page,
        illustrationPrompt: "A train on a table.",
        alignmentScore: 0.42,
        retryCount: 2,
        failures: ["missing child name"],
      },
      {
        ...page,
        illustrationPrompt: "Watercolor scene with Ava and Leo, but missing warmth.",
        alignmentScore: 0.76,
        retryCount: 3,
        failures: ["page still below visual quality threshold"],
      },
    ],
  });

  assert.equal(decision.status, "qa_required");
  assert.equal(decision.shouldRetry, false);
  assert.equal(decision.retryCount, 3);
  assert.equal(decision.flagForHuman, true);
  assert.equal(decision.selectedCandidate?.alignmentScore, 0.76);
});

test("Phase B integration turns one Phase A page artifact into a production candidate and decision", () => {
  const candidate = runPageProductionAttempt({
    page,
    storyboardBeat,
    characterLock,
    childName: "Ava",
    retryCount: 0,
  });
  const decision = runIterationController({ candidates: [candidate] });

  assert.equal(candidate.pageNumber, 3);
  assert.equal(candidate.failures.length, 0);
  assert.ok(candidate.alignmentScore >= 0.9);
  assert.equal(decision.status, "completed");
  assert.equal(decision.flagForHuman, false);
  assert.equal(decision.selectedCandidate?.pageNumber, 3);
});

test("Phase B book-level sheet art direction builds a 12-panel sheet prompt and tile plan", () => {
  const sheetPlan = runSheetArtDirectionAgent({
    story: {
      title: "Ava Waits for the Shiny Train",
      reflectionQuestion: "What can Ava say when she wants a turn?",
      pages: Array.from({ length: 12 }, (_, index) => ({
        pageNumber: index + 1,
        text: `Ava page ${index + 1}.`,
        illustrationPrompt: `Warm watercolor scene with Ava on page ${index + 1}.`,
      })),
    },
    setup: {
      spine: {
        beginning: "Ava starts gently.",
        middle: "Ava takes a breath.",
        ending: "Ava feels proud.",
        emotionalArc: "curious to challenged to confident",
      },
      storyboard: Array.from({ length: 12 }, (_, index) => {
        const pageNumber = index + 1;
        const row = Math.floor(index / 3) + 1;
        const col = (index % 3) + 1;
        return {
          pageNumber,
          beat: `Beat ${pageNumber}`,
          visualFocus: `Visual ${pageNumber}`,
          emotion: pageNumber === 12 ? "proud" : "curious",
          sheetPlacement: {
            pageNumber,
            row,
            col,
            panelLabel: `Panel ${pageNumber} (${row}x${col})`,
          },
        };
      }),
      characterLock,
    },
    characterLock,
  });

  assert.equal(sheetPlan.rows, 4);
  assert.equal(sheetPlan.cols, 3);
  assert.equal(sheetPlan.tiles.length, 12);
  assert.match(sheetPlan.sheetPrompt, /single sheet will later be sliced into 12 individual page images/);
  assert.match(sheetPlan.sheetPrompt, /Panel 12 \(4x3\)/);
});
