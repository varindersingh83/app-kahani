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
