import assert from "node:assert/strict";
import test from "node:test";
import { buildBookSetup, runInputAgent } from "./phaseA";
import { buildCoverPrompt, buildStoryboardSheetPlan, buildStoryboardSheetPrompt } from "./phaseB";
import { runHumanQaGate, runLayoutAgent, runPackagingAgent } from "./phaseC";
import type { ProducedPage } from "./phaseC";

test("book generation integration combines the brief, cover prompt, storyboard prompt, and packaged output", () => {
  const parentInput = {
    mode: "behavior" as const,
    prompt: "My child is learning to ask for a turn instead of grabbing toys.",
    character: {
      name: " Ava ",
      photoUri: "file:///parent/uploads/ava.jpg",
    },
    supportingCharacters: [
      {
        name: "Leo",
        relationship: "little brother",
      },
    ],
  };

  const normalizedInput = runInputAgent(parentInput);
  const setup = buildBookSetup(normalizedInput, "Use warm, short, reassuring language.");
  const coverPrompt = buildCoverPrompt({
    brief: setup.brief,
    characterLock: setup.characterLock,
  });
  const storyboardPrompt = buildStoryboardSheetPrompt({
    brief: setup.brief,
    characterLock: setup.characterLock,
    pageSlots: setup.pageSlots,
  });
  const storyboardPlan = buildStoryboardSheetPlan({
    brief: setup.brief,
    characterLock: setup.characterLock,
    pageSlots: setup.pageSlots,
  });

  const slicePages: ProducedPage[] = Array.from({ length: 12 }, (_, index) => ({
    pageNumber: index + 1,
    text:
      index === 0
        ? "Ava sees Leo roll the shiny train."
        : index === 5
          ? "Ava feels upset, then takes a slow breath."
          : index === 11
            ? "Ava feels proud when they play together."
            : "Ava asks Leo for a turn.",
    illustrationPrompt: `Warm watercolor scene with Ava and Leo near the shiny train on page ${index + 1}.`,
    imageUrl: `file:///tmp/page-${index + 1}.png`,
    retryCount: 0,
    flagForHuman: false,
  }));

  const layout = runLayoutAgent(slicePages, storyboardPlan);
  const packaged = runPackagingAgent({
    title: "Ava Waits for the Shiny Train",
    reflectionQuestion: "What can Ava say when she wants a turn?",
    pages: slicePages,
    coverImageUrl: "file:///tmp/cover.png",
    sheetImageUrl: "file:///tmp/storyboard-sheet.png",
    sheetPlan: storyboardPlan,
  });
  const qaGate = runHumanQaGate(slicePages);

  assert.equal(normalizedInput.character.name, "Ava");
  assert.match(setup.brief.behaviorContext, /ask for a turn/);
  assert.match(coverPrompt, /No text on the image/);
  assert.match(storyboardPrompt, /canonical story text for all 12 pages/);
  assert.equal(storyboardPlan.tiles.length, 12);
  assert.equal(layout.pageCount, 12);
  assert.equal(packaged.title, "Ava Waits for the Shiny Train");
  assert.equal(packaged.pages.length, 12);
  assert.deepEqual(
    packaged.pages.map((page) => page.pageNumber),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  );
  assert.equal(packaged.coverImageUrl, "file:///tmp/cover.png");
  assert.equal(packaged.sheetImageUrl, "file:///tmp/storyboard-sheet.png");
  assert.equal(qaGate.status, "completed");
  assert.equal(qaGate.flaggedForHuman, false);
});
