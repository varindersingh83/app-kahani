import assert from "node:assert/strict";
import test from "node:test";
import type { PipelineStory, StoryRequest } from "./types";
import { buildBookSetup, runInputAgent, runStoryWriterValidation } from "./phaseA";
import { runIterationController, runPageProductionAttempt, runSheetArtDirectionAgent } from "./phaseB";
import { runHumanQaGate, runPackagingAgent } from "./phaseC";

test("book generation integration moves from parent input through Phase A, Phase B, and Phase C output", () => {
  const parentInput: StoryRequest = {
    mode: "behavior",
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

  const storyWriterOutput: PipelineStory = {
    title: "Ava Waits for the Shiny Train",
    reflectionQuestion: "What can Ava say when she wants a turn?",
    pages: Array.from({ length: 12 }, (_, index) => ({
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
    })),
  };

  const normalizedInput = runInputAgent(parentInput);
  const storyValidation = runStoryWriterValidation(storyWriterOutput);
  const phaseAOutput = buildBookSetup(normalizedInput, storyWriterOutput);
  const sheetPlan = runSheetArtDirectionAgent({
    story: storyWriterOutput,
    setup: phaseAOutput,
    characterLock: phaseAOutput.characterLock,
  });

  assert.equal(normalizedInput.character.name, "Ava");
  assert.equal(storyValidation.ok, true);
  assert.equal(phaseAOutput.storyboard.length, 12);
  assert.equal(phaseAOutput.characterLock.name, "Ava");
  assert.match(phaseAOutput.characterLock.stylePrompt, /uploaded reference photo/);
  assert.equal(phaseAOutput.storyboard[0]?.sheetPlacement.panelLabel, "Panel 1 (1x1)");
  assert.equal(sheetPlan.tiles.length, 12);
  assert.match(sheetPlan.sheetPrompt, /sliced into 12 individual page images/);

  const producedPages = storyWriterOutput.pages.map((page) => {
    const storyboardBeat = phaseAOutput.storyboard.find((beat) => beat.pageNumber === page.pageNumber);
    assert.ok(storyboardBeat);

    const candidate = runPageProductionAttempt({
      page,
      storyboardBeat,
      characterLock: phaseAOutput.characterLock,
      childName: normalizedInput.character.name,
      retryCount: 0,
    });
    const decision = runIterationController({ candidates: [candidate] });

    assert.equal(decision.status, "completed");
    assert.equal(decision.flagForHuman, false);

    return {
      pageNumber: candidate.pageNumber,
      text: candidate.text,
      illustrationPrompt: candidate.illustrationPrompt,
      retryCount: decision.retryCount,
      flagForHuman: decision.flagForHuman,
      alignmentScore: candidate.alignmentScore,
      failureReason: decision.failureReason,
    };
  });

  const phaseCOutput = runPackagingAgent({
    title: storyWriterOutput.title,
    reflectionQuestion: storyWriterOutput.reflectionQuestion,
    pages: producedPages,
    sheetPlan,
  });
  const qaGate = runHumanQaGate(producedPages);

  assert.equal(qaGate.status, "completed");
  assert.equal(qaGate.flaggedForHuman, false);
  assert.equal(qaGate.retryTotal, 0);
  assert.equal(phaseCOutput.title, "Ava Waits for the Shiny Train");
  assert.equal(phaseCOutput.reflectionQuestion, "What can Ava say when she wants a turn?");
  assert.equal(phaseCOutput.pages.length, 12);
  assert.deepEqual(
    phaseCOutput.pages.map((page) => page.pageNumber),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  );
  assert.match(phaseCOutput.pages[0]?.text ?? "", /Ava/);
  assert.match(phaseCOutput.pages[0]?.illustrationPrompt ?? "", /Warm watercolor/);
  assert.match(phaseCOutput.pages[0]?.illustrationPrompt ?? "", /Ava appears consistently throughout/);
  assert.deepEqual(phaseCOutput.pages[0]?.imageUrl, undefined);
});
