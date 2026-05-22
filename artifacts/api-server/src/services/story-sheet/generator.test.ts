import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import type { GenerateStoryRequest } from "@workspace/api-zod";
import {
  applyDeterministicStoryQualityRules,
  buildStoryQaPrompt,
  generateStoryTextWithQa,
  buildImageSpec,
  buildReferenceImageUris,
  buildSheetPrompt,
  normalizeStoryQualityReview,
  normalizeStoryJson,
  sliceStoryboardSheet,
} from "./generator";
import { promptPath } from "./paths";
import type { AiConfig, StorySheetInput } from "./types";

const testConfig: AiConfig = {
  baseUrl: "https://example.test",
  apiKey: "test-key",
  textModel: "test-text-model",
  imageModel: "test-image-model",
};

function buildTestStory(
  count: number,
  input: {
    title?: string;
    childName?: string;
    behavior?: string;
    pageText?: (index: number) => string;
  } = {},
): StorySheetInput {
  const childName = input.childName ?? "Maya";
  return {
    title: input.title ?? `${childName} and the Blocks`,
    child_name: childName,
    parent_name: "Mom",
    parent_role: "parent",
    behavior: input.behavior ?? "sharing",
    pages: Array.from({ length: count }, (_, index) => ({
      page: index + 1,
      text: input.pageText?.(index) ?? `Story text ${index + 1}`,
      scene: `Scene ${index + 1}`,
      composition: "Medium shot",
      emotion: "hopeful",
    })),
  };
}

test("story JSON prompt includes learned practical-parenting rating rules", async () => {
  const prompt = await readFile(promptPath("story-json-master-prompt.txt"), "utf8");

  assert.match(prompt, /Parent practicality/);
  assert.match(prompt, /celebrated children's book author and illustrator team/);
  assert.match(prompt, /premium, deeply engaging 12-page/);
  assert.match(prompt, /Pages 1-2 - The Deep Immersion/);
  assert.match(prompt, /Pages 7-8 - The Safe Harbor/);
  assert.match(prompt, /Integrate sound effects directly into sentences/);
  assert.match(prompt, /Expert grounding/);
  assert.match(prompt, /visible next-step behavior/);
  assert.match(prompt, /parent accidentally rewards the problem behavior/);
  assert.match(prompt, /fake choice/);
  assert.match(prompt, /Rude\/disrespectful tone/);
  assert.match(prompt, /modeling the replacement phrase/);
  assert.match(prompt, /Safety issues: set the safety boundary immediately/);
});

test("buildStoryQaPrompt asks the judge to reject vague non-scene behavior stories", () => {
  const story = buildTestStory(12, {
    title: "Emma at the Park Gate",
    childName: "Emma",
    behavior: "Won't leave the park",
    pageText: (index) =>
      index === 3
        ? "\"Park feet to the gate,\" Mom says."
        : `Story text ${index + 1}`,
  });

  const prompt = buildStoryQaPrompt(story, "Won't leave the park");

  assert.match(prompt, /exactly 12 pages/);
  assert.match(prompt, /Deep Immersion, Shift, Volcano, Safe Harbor, Bridge, Cozy Close/);
  assert.match(prompt, /picture book/);
  assert.match(prompt, /show-don't-tell/);
  assert.match(prompt, /emotional co-regulation/);
  assert.match(prompt, /mainstream expert strategy/);
  assert.match(prompt, /child must practice one visible next-step behavior/i);
  assert.match(prompt, /Reject vague parent lines like 'park feet to the gate'/);
  assert.match(prompt, /Won't leave the park/);
});

test("buildStoryQaPrompt requires expert-aligned repair for rude tone stories", () => {
  const story = buildTestStory(10, {
    title: "Emma and the Morning Cup",
    childName: "Emma",
    behavior: "Talking in rude tone with parents",
    pageText: (index) =>
      [
        "Emma wants the blue morning cup.",
        "Mom says, \"First, sip, then we go.\"",
        "Emma stomps one foot and talks sharp.",
        "\"Uh-oh—stop that rude voice,\" Mom says.",
        "Emma pushes the cup forward.",
        "Mom points to the table mat.",
        "Emma reaches for the cup again.",
        "Emma makes a new sound.",
        "Mom dips the spoon into cereal.",
        "Emma holds the cup, still tight.",
      ][index] ?? `Story text ${index + 1}`,
  });

  const prompt = buildStoryQaPrompt(story, "Talking in rude tone with parents");

  assert.match(prompt, /rude or disrespectful tone/i);
  assert.match(prompt, /communication boundary/i);
  assert.match(prompt, /replacement phrase/i);
  assert.match(prompt, /retrying with kinder or more respectful words/i);
});

test("deterministic QA fails rude tone stories without respectful replacement practice", () => {
  const story = buildTestStory(10, {
    title: "Emma and the Morning Cup",
    childName: "Emma",
    behavior: "Talking in rude tone with parents",
    pageText: (index) =>
      [
        "Emma wants the blue morning cup.",
        "Mom says, \"First, sip, then we go.\"",
        "Emma stomps one foot and talks sharp.",
        "\"Uh-oh—stop that rude voice,\" Mom says.",
        "Emma pushes the cup forward.",
        "Mom points to the table mat.",
        "Emma reaches for the cup again.",
        "Emma makes a new sound.",
        "Mom dips the spoon into cereal.",
        "Emma holds the cup, still tight.",
      ][index] ?? `Story text ${index + 1}`,
  });

  const review = applyDeterministicStoryQualityRules(
    {
      score: 9,
      pass: true,
      issues: [],
      strengths: ["Calm parent."],
      rewriteInstructions: "",
    },
    story,
    "Talking in rude tone with parents",
  );

  assert.equal(review.pass, false);
  assert.equal(review.score, 5);
  assert.match(review.issues.join(" "), /replacement phrase/);
});

test("normalizeStoryQualityReview requires score threshold even if the judge says pass", () => {
  assert.deepEqual(
    normalizeStoryQualityReview({
      score: 7,
      pass: true,
      issues: ["Parent action is too vague."],
      rewriteInstructions: "Use a countdown and a clear choice.",
    }),
    {
      score: 7,
      pass: false,
      issues: ["Parent action is too vague."],
      strengths: [],
      rewriteInstructions: "Use a countdown and a clear choice.",
    },
  );
});

test("generateStoryTextWithQa rewrites a failing draft before accepting", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "kahani-story-qa-"));
  const request: GenerateStoryRequest = {
    mode: "behavior",
    prompt: "Emma will not leave the park",
    character: { name: "Emma" },
  };
  const badStory = buildTestStory(12, {
    title: "Emma at the Park Gate",
    childName: "Emma",
    behavior: "Emma will not leave the park",
    pageText: (index) =>
      index === 3
        ? "\"Park feet to the gate,\" Mom says."
        : `Park text ${index + 1}`,
  });
  const goodStory = buildTestStory(12, {
    title: "Emma Takes Two Last Slides",
    childName: "Emma",
    behavior: "Emma will not leave the park",
    pageText: (index) =>
      [
        "Emma climbs the slide steps while Mom waits by the bench.",
        "\"Two more slides, then gate,\" Mom says.",
        "Emma slides once and runs back laughing.",
        "Mom holds up one finger. \"Last slide.\"",
        "Emma slides again and lands on her feet.",
        "\"Hop or stomp to the gate?\" Mom asks.",
        "Emma stomps three big stomps on the path.",
        "At the gate, Emma reaches for Mom's hand.",
        "She looks back once at the slide.",
        "Then Emma walks with Mom to the sidewalk.",
        "Mom squeezes her hand at the curb.",
        "Emma leans close while the park grows quiet.",
      ][index] ?? `Park text ${index + 1}`,
  });
  const responses = [
    { data: badStory, usage: { total_tokens: 10 } },
    {
      data: {
        score: 5,
        pass: false,
        issues: ["Parent action is vague and not a real transition strategy."],
        rewriteInstructions:
          "Use two last turns, then a clear choice to walk to the gate.",
      },
      usage: { total_tokens: 5 },
    },
    { data: goodStory, usage: { total_tokens: 11 } },
    {
      data: {
        score: 9,
        pass: true,
        issues: [],
        strengths: ["Clear countdown and visible child action."],
        rewriteInstructions: "",
      },
      usage: { total_tokens: 4 },
    },
  ];
  const textClient = async () => {
    const response = responses.shift();
    if (!response) throw new Error("Unexpected text client call.");
    return response;
  };

  try {
    const result = await generateStoryTextWithQa({
      config: testConfig,
      request,
      behavior: "Emma will not leave the park",
      storyPrompt: "write story",
      outputDir: tempRoot,
      textClient,
    });

    assert.equal(result.story.title, "Emma Takes Two Last Slides");
    assert.equal(result.attempts.length, 2);
    assert.equal(result.attempts[0]?.accepted, false);
    assert.equal(result.attempts[1]?.accepted, true);
    assert.equal(result.storyUsage.total_tokens, 21);
    assert.equal(result.qaUsage.total_tokens, 9);
    assert.match(
      await readFile(path.join(tempRoot, "story-rewrite-prompt-2.txt"), "utf8"),
      /Use two last turns/,
    );
    assert.match(
      await readFile(path.join(tempRoot, "story-qa-1.json"), "utf8"),
      /not a real transition strategy/,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
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
    pages: Array.from({ length: 12 }, (_, index) => ({
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

test("normalizeStoryJson accepts exactly 12-page stories", () => {
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
    normalizeStoryJson(buildStory(12), request, "sharing").pages.length,
    12,
  );
});

test("normalizeStoryJson rejects page counts outside the 12-page contract", () => {
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
    () => normalizeStoryJson(buildStory(11), request, "sharing"),
    /at least 12 pages/,
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
