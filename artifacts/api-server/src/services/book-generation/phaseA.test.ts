import assert from "node:assert/strict";
import test from "node:test";
import type { PipelineStory, StoryRequest } from "./types";
import {
  buildBehaviorContext,
  buildBookSetup,
  buildSupportingCastContext,
  runCharacterConsistencyAgent,
  runInputAgent,
  runStoryboardAgent,
  runStorySpineAgent,
  runStoryWriterValidation,
} from "./phaseA";

const request: StoryRequest = {
  mode: "behavior",
  prompt: " sharing toys kindly ",
  character: {
    name: " Mia ",
    appearance: "curly brown hair, yellow rain boots",
  },
  supportingCharacters: [
    {
      name: "Dad",
      relationship: "father",
    },
  ],
};

const story: PipelineStory = {
  title: "Mia Shares the Sunny Blocks",
  reflectionQuestion: "What helped Mia share?",
  pages: Array.from({ length: 12 }, (_, index) => ({
    pageNumber: index + 1,
    text:
      index === 0
        ? "Mia smiles at the sunny blocks."
        : index === 6
          ? "Mia feels proud when Dad notices her kind turn."
          : index === 11
            ? "Mia feels calm and happy."
            : "Mia takes a gentle turn.",
    illustrationPrompt: `Warm watercolor scene with Mia and sunny blocks on page ${index + 1}.`,
  })),
};

test("Phase A Step 1 InputAgent normalizes parent input without inventing fields", () => {
  const normalized = runInputAgent(request);

  assert.equal(normalized.mode, "behavior");
  assert.equal(normalized.prompt, "sharing toys kindly");
  assert.equal(normalized.character.name, "Mia");
  assert.equal(normalized.character.appearance, "curly brown hair, yellow rain boots");
  assert.deepEqual(normalized.supportingCharacters, [{ name: "Dad", relationship: "father" }]);
});

test("Phase A Step 1 context builders preserve behavior intent and supporting cast", () => {
  const behaviorContext = buildBehaviorContext(request);
  const castContext = buildSupportingCastContext(request);

  assert.match(behaviorContext, /sharing toys kindly/);
  assert.match(behaviorContext, /Never shame the child/);
  assert.match(castContext, /Dad \(father\)/);
  assert.match(castContext, /do not force them/);
});

test("Phase A Step 2 StorySpineAgent derives beginning, middle, ending, and emotional arc", () => {
  const spine = runStorySpineAgent(story);

  assert.equal(spine.beginning, "Mia smiles at the sunny blocks.");
  assert.equal(spine.middle, "Mia feels proud when Dad notices her kind turn.");
  assert.equal(spine.ending, "Mia feels calm and happy.");
  assert.equal(spine.emotionalArc, "curious to challenged to confident");
});

test("Phase A Step 3 StoryWriterAgent validation accepts a complete 12-page story", () => {
  const validation = runStoryWriterValidation(story);

  assert.equal(validation.ok, true);
  assert.deepEqual(validation.failures, []);
});

test("Phase A Step 3 StoryWriterAgent validation rejects malformed story output", () => {
  const validation = runStoryWriterValidation({
    ...story,
    pages: story.pages.slice(0, 11),
  });

  assert.equal(validation.ok, false);
  assert.match(validation.failures.join("\n"), /expected 12 pages/);
  assert.match(validation.failures.join("\n"), /missing page 12/);
});

test("Phase A Step 4 StoryboardAgent creates one visual beat per page in order", () => {
  const storyboard = runStoryboardAgent(story);

  assert.equal(storyboard.length, 12);
  assert.equal(storyboard[0]?.pageNumber, 1);
  assert.equal(storyboard[11]?.pageNumber, 12);
  assert.equal(storyboard[0]?.beat, "Mia smiles at the sunny blocks.");
  assert.match(storyboard[0]?.visualFocus ?? "", /Warm watercolor scene/);
  assert.equal(storyboard[6]?.emotion, "proud");
  assert.deepEqual(storyboard[0]?.sheetPlacement, {
    pageNumber: 1,
    row: 1,
    col: 1,
    panelLabel: "Panel 1 (1x1)",
  });
  assert.deepEqual(storyboard[11]?.sheetPlacement, {
    pageNumber: 12,
    row: 4,
    col: 3,
    panelLabel: "Panel 12 (4x3)",
  });
});

test("Phase A Step 5 CharacterConsistencyAgent locks identity and style constraints", () => {
  const lock = runCharacterConsistencyAgent(request);

  assert.equal(lock.name, "Mia");
  assert.equal(lock.appearance, "curly brown hair, yellow rain boots");
  assert.match(lock.stylePrompt, /curly brown hair, yellow rain boots/);
  assert.match(lock.stylePrompt, /Warm watercolor/);
  assert.match(lock.negativePrompt, /No scary imagery/);
  assert.match(lock.negativePrompt, /no inconsistent character traits/);
});

test("Phase A setup combines spine, storyboard, and character lock", () => {
  const setup = buildBookSetup(request, story);

  assert.equal(setup.spine.beginning, story.pages[0]?.text);
  assert.equal(setup.storyboard.length, 12);
  assert.equal(setup.characterLock.appearance, "curly brown hair, yellow rain boots");
});

test("Phase A integration turns parent input and story output into the expected setup artifact", () => {
  const parentInput: StoryRequest = {
    mode: "behavior",
    prompt:
      "My child is learning to stop grabbing toys and ask for a turn with her little brother.",
    character: {
      name: " Ava ",
      photoUri: "file:///parent/ava.jpg",
    },
    supportingCharacters: [
      {
        name: "Leo",
        relationship: "little brother",
      },
      {
        name: "Mom",
        relationship: "mother",
      },
    ],
  };

  const storyWriterOutput: PipelineStory = {
    title: "Ava's Gentle Turn",
    reflectionQuestion: "What can Ava say when she wants a turn?",
    pages: Array.from({ length: 12 }, (_, index) => ({
      pageNumber: index + 1,
      text:
        index === 0
          ? "Ava sees Leo holding the shiny train."
          : index === 5
            ? "Ava feels upset, then takes a slow breath."
            : index === 11
              ? "Ava feels proud when she and Leo play together."
              : "Ava asks for a turn with gentle words.",
      illustrationPrompt: `Warm watercolor scene of Ava in a red cardigan with Leo and the shiny train, page ${
        index + 1
      }.`,
    })),
  };

  const normalizedInput = runInputAgent(parentInput);
  const behaviorContext = buildBehaviorContext(normalizedInput);
  const supportingCast = buildSupportingCastContext(normalizedInput);
  const storyValidation = runStoryWriterValidation(storyWriterOutput);
  const setup = buildBookSetup(normalizedInput, storyWriterOutput);

  assert.equal(normalizedInput.character.name, "Ava");
  assert.equal(normalizedInput.prompt, parentInput.prompt);
  assert.match(behaviorContext, /stop grabbing toys and ask for a turn/);
  assert.match(supportingCast, /Leo \(little brother\)/);
  assert.match(supportingCast, /Mom \(mother\)/);

  assert.equal(storyValidation.ok, true);
  assert.equal(setup.spine.beginning, "Ava sees Leo holding the shiny train.");
  assert.equal(setup.spine.middle, "Ava asks for a turn with gentle words.");
  assert.equal(setup.spine.ending, "Ava feels proud when she and Leo play together.");

  assert.equal(setup.storyboard.length, 12);
  assert.deepEqual(
    setup.storyboard.map((page) => page.pageNumber),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  );
  assert.match(setup.storyboard[0]?.visualFocus ?? "", /Warm watercolor scene of Ava/);
  assert.equal(setup.storyboard[5]?.emotion, "supported");
  assert.equal(setup.storyboard[11]?.emotion, "proud");

  assert.equal(setup.characterLock.name, "Ava");
  assert.equal(
    setup.characterLock.appearance,
    "consistent child appearance based on the uploaded reference photo",
  );
  assert.match(setup.characterLock.stylePrompt, /Ava appears consistently throughout/);
  assert.match(setup.characterLock.stylePrompt, /uploaded reference photo/);
  assert.match(setup.characterLock.negativePrompt, /no inconsistent character traits/);
});
