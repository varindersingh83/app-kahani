import assert from "node:assert/strict";
import test from "node:test";
import type { GenerateStoryRequest } from "@workspace/api-zod";
import { buildImageSpec, buildSheetPrompt } from "./generator";
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
