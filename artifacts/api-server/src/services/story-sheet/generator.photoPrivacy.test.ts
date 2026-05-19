import assert from "node:assert/strict";
import test from "node:test";
import type { GenerateStoryRequest } from "@workspace/api-zod";
import {
  buildImageSpec,
  buildReferenceImageUris,
  buildSheetPrompt,
} from "./generator";
import type { StorySheetInput } from "./types";

test("buildReferenceImageUris never forwards child or parent photo URIs", () => {
  const request: GenerateStoryRequest = {
    mode: "behavior",
    character: {
      name: "Maya",
      photoUri: "data:image/png;base64,child",
      appearance: "curly black hair, red sweater",
    },
    supportingCharacters: [
      {
        name: "Mom",
        relationship: "parent",
        photoUri: "https://example.com/mom.jpg",
        appearance: "long black hair, green cardigan",
      },
    ],
  };

  assert.deepEqual(buildReferenceImageUris(request), []);
});

test("buildImageSpec uses redacted labels and descriptors instead of photo instructions or names", () => {
  const request: GenerateStoryRequest = {
    mode: "behavior",
    character: {
      name: "Maya",
      photoUri: "file:///tmp/maya.png",
      appearance: "curly black hair, red sweater",
    },
    supportingCharacters: [
      {
        name: "Mom",
        relationship: "parent",
        photoUri: "file:///tmp/mom.png",
        appearance: "long black hair, green cardigan",
      },
    ],
  };

  const spec = buildImageSpec(request);

  assert.match(spec, /Main child: the child\./);
  assert.match(spec, /Appearance descriptor: curly black hair, red sweater/);
  assert.match(spec, /adult caregiver \(parent\)/);
  assert.match(spec, /Adult appearance descriptor: long black hair, green cardigan/);
  assert.doesNotMatch(spec, /Maya|Mom|uploaded|reference image|photoUri|file:\/\//);
});

test("buildSheetPrompt redacts real child and parent names before image-provider prompt construction", () => {
  const story: StorySheetInput = {
    title: "Maya Shares With Mom",
    child_name: "Maya",
    parent_name: "Mom",
    parent_role: "parent",
    behavior: "sharing toys",
    pages: [
      {
        page: 1,
        text: "Maya sat beside Mom and held the toy.",
        scene: "Maya and Mom sit in the playroom.",
        composition: "Medium shot",
        emotion: "curious",
      },
    ],
  };
  const request: GenerateStoryRequest = {
    mode: "behavior",
    character: {
      name: "Maya",
      appearance: "red sweater",
    },
    supportingCharacters: [
      { name: "Mom", relationship: "parent", appearance: "green cardigan" },
    ],
  };

  const prompt = buildSheetPrompt(
    "Input JSON:\n{{JSON_INPUT}}\n\nImage spec:\n{{IMAGE_SPEC}}\n",
    story,
    request,
  );

  assert.doesNotMatch(prompt, /Maya|Mom/);
  assert.match(prompt, /the child/);
  assert.match(prompt, /the caregiver/);
});
