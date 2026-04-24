import assert from "node:assert/strict";
import test from "node:test";
import type { StoryRequest } from "./types";
import {
  buildBehaviorContext,
  buildBookSetup,
  buildStoryPlan,
  buildSupportingCastContext,
  runCharacterConsistencyAgent,
  runInputAgent,
} from "./phaseA";
import { getSheetPlacement } from "./sheet";

test("Phase A input agent trims and normalizes parent input", () => {
  const normalized = runInputAgent({
    mode: "behavior",
    prompt: "  My child is learning to ask for a turn.  ",
    character: {
      name: " Ava ",
      photoUri: "file:///parent/uploads/ava.jpg",
    },
  });

  assert.equal(normalized.mode, "behavior");
  assert.equal(normalized.prompt, "My child is learning to ask for a turn.");
  assert.equal(normalized.character.name, "Ava");
});

test("Phase A contexts build a reusable story brief for the image model", () => {
  const request: StoryRequest = {
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
  };

  const behaviorContext = buildBehaviorContext(request);
  const supportingCastContext = buildSupportingCastContext(request);

  assert.match(behaviorContext, /gentle behavior-support story/);
  assert.match(behaviorContext, /never shame the child/i);
  assert.match(supportingCastContext, /Leo \(little brother\)/);
});

test("Phase A character consistency agent locks the child appearance and style", () => {
  const lock = runCharacterConsistencyAgent({
    mode: "random",
    character: {
      name: "Noah",
      appearance: "curly hair, yellow raincoat, blue boots",
    },
  });

  assert.equal(lock.name, "Noah");
  assert.match(lock.stylePrompt, /warm watercolor children's book style/i);
  assert.match(lock.negativePrompt, /No scary imagery/);
});

test("Phase A setup combines the brief, character lock, and fixed 3x4 sheet slots", () => {
  const setup = buildBookSetup(
    {
      mode: "behavior",
      prompt: "My child is learning to wait their turn.",
      character: {
        name: "Ava",
        photoUri: "file:///parent/uploads/ava.jpg",
      },
    },
    "Prioritize calm, short sentences.",
  );

  assert.equal(setup.brief.childName, "Ava");
  assert.match(setup.brief.behaviorContext, /wait their turn/);
  assert.match(setup.brief.learningHints, /calm, short sentences/);
  assert.equal(setup.pageSlots.length, 12);
  assert.deepEqual(setup.pageSlots[0], getSheetPlacement(1));
  assert.deepEqual(setup.pageSlots[11], getSheetPlacement(12));
  assert.equal(setup.characterLock.name, "Ava");
});

test("Phase A story plan creates a canonical 12-page story before image generation", () => {
  const setup = buildBookSetup(
    {
      mode: "behavior",
      prompt: "My child is learning to ask for a turn.",
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
    "Keep the tone calm and reassuring.",
  );

  const storyPlan = buildStoryPlan(setup);

  assert.equal(storyPlan.pages.length, 12);
  assert.match(storyPlan.title, /Ava and the My child is learning to ask for a turn/);
  assert.match(storyPlan.reflectionQuestion, /What can Ava try/);
  assert.match(storyPlan.storySpine.beginning, /Ava/);
  assert.match(storyPlan.masterSheetPrompt, /canonical 12-page story text in structured JSON/i);
  assert.match(storyPlan.masterSheetPrompt, /story progression across panels from top left to bottom right/i);
  assert.match(storyPlan.masterSheetPrompt, /Panel 1 \(1x1\)/);
  assert.match(storyPlan.pages[0]!.text, /Ava/);
});
