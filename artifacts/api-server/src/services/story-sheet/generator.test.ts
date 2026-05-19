import assert from "node:assert/strict";
import test from "node:test";
import type { GenerateStoryRequest } from "@workspace/api-zod";
import {
  buildImageSpec,
  buildReferenceImageUris,
  buildSheetPrompt,
  normalizeStoryJson,
} from "./generator";
import type { StorySheetInput } from "./types";

test("buildImageSpec preserves descriptors without forwarding uploaded photo constraints", () => {
  const request: GenerateStoryRequest = {
    mode: "behavior",
    prompt: "sharing toys",
    character: {
      name: " Maya ",
      photoUri: "file:///tmp/maya.png",
      appearance: "curly black hair, yellow rain boots, red sweater",
    },
    supportingCharacters: [
      { name: "Nico", relationship: "older brother" },
      {
        name: "Mom",
        relationship: "parent",
        photoUri: "file:///tmp/mom.png",
        appearance: "long blonde hair, gray shirt",
      },
    ],
  };

  const spec = buildImageSpec(request);

  assert.match(spec, /Main child: the child\./);
  assert.doesNotMatch(spec, /Maya|Mom|uploaded|reference image|file:\/\//);
  assert.match(
    spec,
    /Appearance descriptor: curly black hair, yellow rain boots, red sweater/,
  );
  assert.match(spec, /supporting child or family member \(older brother\)/);
  assert.match(spec, /adult caregiver \(parent\)/);
  assert.match(spec, /Adult appearance descriptor: long blonde hair, gray shirt/);
  assert.match(spec, /Never change the main child's outfit/);
  assert.deepEqual(buildReferenceImageUris(request), []);
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

  assert.match(prompt, /"title": "the child Tries Again"/);
  assert.match(prompt, /Appearance descriptor: red sweater/);
  assert.doesNotMatch(prompt, /{{JSON_INPUT}}|{{IMAGE_SPEC}}/);
});

test("normalizeStoryJson locks generated story text to the requested child name", () => {
  const story: StorySheetInput = {
    title: "Leo and the Little Door",
    child_name: "Leo",
    parent_name: "Mom",
    parent_role: "parent",
    behavior: "Saying no constantly",
    pages: Array.from({ length: 12 }, (_, index) => ({
      page: index + 1,
      text:
        index === 0
          ? "Leo said no and held the red cup."
          : `Story text ${index + 1}`,
      scene:
        index === 0
          ? "Leo stands by the kitchen chair."
          : `Scene ${index + 1}`,
      composition: "Medium shot",
      emotion: "mad",
    })),
  };
  const request: GenerateStoryRequest = {
    mode: "behavior",
    character: { name: "Liam" },
  };

  const normalized = normalizeStoryJson(story, request, "Saying no constantly");

  assert.equal(normalized.child_name, "Liam");
  assert.equal(normalized.title, "Liam and the Little Door");
  assert.equal(normalized.pages[0]?.text, "Liam said no and held the red cup.");
  assert.equal(normalized.pages[0]?.scene, "Liam stands by the kitchen chair.");
});
