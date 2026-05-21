import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import type { GenerateStoryRequest } from "@workspace/api-zod";
import {
  buildImageSpec,
  buildReferenceImageUris,
  buildSheetPrompt,
  normalizeStoryJson,
  sliceStoryboardSheet,
} from "./generator";
import { promptPath } from "./paths";
import type { StorySheetInput } from "./types";

test("story JSON prompt includes learned practical-parenting rating rules", async () => {
  const prompt = await readFile(promptPath("story-json-master-prompt.txt"), "utf8");

  assert.match(prompt, /Parent practicality/);
  assert.match(prompt, /visible next-step behavior/);
  assert.match(prompt, /parent accidentally rewards the problem behavior/);
  assert.match(prompt, /fake choice/);
  assert.match(prompt, /Safety issues: set the safety boundary immediately/);
});

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
    pages: Array.from({ length: 8 }, (_, index) => ({
      page: index + 1,
      text:
        index === 0
          ? "Leo was making a sun. It had to be a perfect circle."
          : index === 1
            ? "Leo's circle grew a bumpy chin."
            : `Leo tried again on page ${index + 1}.`,
      scene:
        index === 0
          ? "Leo sits at the kitchen table with a yellow crayon."
          : index === 1
            ? "Leo frowns at the bumpy circle on the paper."
            : `Leo sits near the paper on page ${index + 1}.`,
      composition: index === 1 ? "Close-up" : "Medium shot",
      emotion: index === 1 ? "frustrated" : "focused",
    })),
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

test("normalizeStoryJson accepts 8-page, 10-page, and 12-page stories without truncating", () => {
  const request: GenerateStoryRequest = {
    mode: "behavior",
    character: { name: "Maya" },
  };
  const buildStory = (count: number): StorySheetInput => ({
    title: "Maya and the Blocks",
    child_name: "Maya",
    parent_name: "Mom",
    parent_role: "parent",
    behavior: "sharing",
    pages: Array.from({ length: count }, (_, index) => ({
      page: index + 1,
      text: `Story text ${index + 1}`,
      scene: `Scene ${index + 1}`,
      composition: "Medium shot",
      emotion: "hopeful",
    })),
  });

  assert.equal(
    normalizeStoryJson(buildStory(8), request, "sharing").pages.length,
    8,
  );
  assert.equal(
    normalizeStoryJson(buildStory(10), request, "sharing").pages.length,
    10,
  );
  assert.equal(
    normalizeStoryJson(buildStory(12), request, "sharing").pages.length,
    12,
  );
});

test("normalizeStoryJson rejects page counts outside the 8-12 contract", () => {
  const request: GenerateStoryRequest = {
    mode: "behavior",
    character: { name: "Maya" },
  };
  const buildStory = (count: number): StorySheetInput => ({
    title: "Maya and the Blocks",
    child_name: "Maya",
    parent_name: "Mom",
    parent_role: "parent",
    behavior: "sharing",
    pages: Array.from({ length: count }, (_, index) => ({
      page: index + 1,
      text: `Story text ${index + 1}`,
      scene: `Scene ${index + 1}`,
      composition: "Medium shot",
      emotion: "hopeful",
    })),
  });

  assert.throws(
    () => normalizeStoryJson(buildStory(7), request, "sharing"),
    /at least 8 pages/,
  );
  assert.throws(
    () => normalizeStoryJson(buildStory(13), request, "sharing"),
    /no more than 12 pages/,
  );
});

test("sliceStoryboardSheet slices a 4096 square sheet into fixed 4x4 slots", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "kahani-4x4-sheet-"));
  try {
    const sheetPath = path.join(tempRoot, "sheet.png");
    const outputDir = path.join(tempRoot, "pages");
    const panelSize = 1024;
    const panels = Array.from({ length: 16 }, (_, index) => ({
      input: {
        create: {
          width: panelSize,
          height: panelSize,
          channels: 3 as const,
          background: {
            r: (index * 37) % 255,
            g: (index * 67) % 255,
            b: (index * 97) % 255,
          },
        },
      },
      left: (index % 4) * panelSize,
      top: Math.floor(index / 4) * panelSize,
    }));

    await sharp({
      create: {
        width: panelSize * 4,
        height: panelSize * 4,
        channels: 3 as const,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite(panels)
      .png()
      .toFile(sheetPath);

    const slices = await sliceStoryboardSheet(sheetPath, outputDir);

    assert.equal(slices.length, 16);
    assert.equal(path.basename(slices[0]!.output), "01_cover.png");
    assert.equal(path.basename(slices[1]!.output), "02_belongs_to.png");
    assert.equal(path.basename(slices[2]!.output), "03_the_end.png");
    assert.equal(path.basename(slices[3]!.output), "04_blank.png");
    assert.equal(path.basename(slices[4]!.output), "story_page_01.png");
    assert.equal(path.basename(slices[15]!.output), "story_page_12.png");
    assert.deepEqual(slices[4]!.crop, {
      left: 0,
      top: 1024,
      right: 1024,
      bottom: 2048,
    });
    assert.deepEqual(slices[15]!.crop, {
      left: 3072,
      top: 3072,
      right: 4096,
      bottom: 4096,
    });
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
