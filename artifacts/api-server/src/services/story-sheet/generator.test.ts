import assert from "node:assert/strict";
import test from "node:test";
import type { GenerateStoryRequest } from "@workspace/api-zod";
import { buildImageSpec, buildSheetPrompt, normalizeStoryJson } from "./generator";
import type { StorySheetInput } from "./types";

test("buildImageSpec preserves uploaded photo, appearance, and supporting cast constraints", () => {
  const request: GenerateStoryRequest = {
    mode: "behavior",
    prompt: "sharing toys",
    character: {
      name: " Maya ",
      photoUri: "file:///tmp/maya.png",
      appearance: "curly black hair, yellow rain boots, red sweater",
    },
    supportingCharacters: [{ name: "Nico", relationship: "older brother" }],
  };

  const spec = buildImageSpec(request);

  assert.match(spec, /Main child: Maya\./);
  assert.match(spec, /uploaded child reference image/);
  assert.match(spec, /curly black hair, yellow rain boots, red sweater/);
  assert.match(spec, /Nico \(older brother\)/);
  assert.match(spec, /Never change the main child's outfit/);
});

test("buildSheetPrompt injects the story JSON and image spec without leaving placeholders", () => {
  const story: StorySheetInput = {
    title: "Maya Tries Again",
    child_name: "Maya",
    parent_name: "Mom",
    parent_role: "parent",
    behavior: "sharing toys",
    pages: Array.from({ length: 12 }, (_, index) => ({
      page: index + 1,
      text: `Story text ${index + 1}`,
      scene: `Scene ${index + 1}`,
      composition: "Medium shot",
      emotion: "hopeful",
    })),
  };
  const request: GenerateStoryRequest = {
    mode: "behavior",
    character: {
      name: "Maya",
      appearance: "red sweater",
    },
  };

  const prompt = buildSheetPrompt(
    "Input JSON:\n{{JSON_INPUT}}\n\nImage spec:\n{{IMAGE_SPEC}}\n",
    story,
    request,
  );

  assert.match(prompt, /"title": "Maya Tries Again"/);
  assert.match(prompt, /Appearance lock: red sweater/);
  assert.doesNotMatch(prompt, /{{JSON_INPUT}}|{{IMAGE_SPEC}}/);
});

test("normalizeStoryJson replaces the model-invented child name with the selected character name", () => {
  const request: GenerateStoryRequest = {
    mode: "behavior",
    prompt: "perfectionism and frustration when a drawing goes wrong",
    character: {
      name: "Liam",
    },
  };
  const story: StorySheetInput = {
    title: "Leo's Golden Sun",
    child_name: "Leo",
    parent_name: "Mom",
    parent_role: "parent",
    behavior: "drawing frustration",
    pages: [
      {
        page: 1,
        text: "Leo was making a sun. It had to be a perfect circle.",
        scene: "Leo sits at the kitchen table with a yellow crayon.",
        composition: "Medium shot",
        emotion: "focused",
      },
      {
        page: 2,
        text: "Leo's circle grew a bumpy chin.",
        scene: "Leo frowns at the bumpy circle on the paper.",
        composition: "Close-up",
        emotion: "frustrated",
      },
    ],
  };

  const normalized = normalizeStoryJson(story, request, request.prompt ?? "");

  assert.equal(normalized.child_name, "Liam");
  assert.equal(normalized.title, "Liam's Golden Sun");
  assert.match(normalized.pages[0]?.text ?? "", /Liam was making a sun/);
  assert.match(normalized.pages[0]?.scene ?? "", /Liam sits/);
  assert.match(normalized.pages[1]?.text ?? "", /Liam's circle/);
  assert.doesNotMatch(JSON.stringify(normalized), /\bLeo\b/);
});
