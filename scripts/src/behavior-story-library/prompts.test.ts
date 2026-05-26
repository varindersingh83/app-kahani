import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStoryConceptGeneratorPrompt,
  buildStoryConceptJudgePrompt,
  normalizeJudgeReview,
  normalizeStoryConceptCandidates,
} from "./prompts";
import type { BehaviorTemplate, ReferenceBook } from "./types";

const behavior: BehaviorTemplate = {
  categoryId: "template_4_refusing_to_get_dressed",
  sourceRow: 4,
  scene: "morning bedroom",
  visibleBehavior: "Refusing to get dressed",
  mechanism: "Need for attention, connection, predictability, or sensory regulation.",
  strategy: "Use Montessori-style freedom within limits: 'You may do A or B.'",
  childStorySkill: "practice choosing one acceptable clothing step",
  parentGuidance:
    "Use Montessori-style freedom within limits. Avoid yelling or giving the forbidden item.",
  targetOutcome:
    "Child feels seen but not in charge of the boundary, reducing future power struggles.",
  storyFocusLabel: "Refusing to get dressed",
  avoidDoing: "Do not yell, shame, threaten, hit, or over-explain.",
};

const referenceBooks: ReferenceBook[] = [
  {
    title: "Llama Llama Red Pajama",
    author: "Anna Dewdney",
    source: "open_library",
    sourceId: "/works/OL1W",
    firstPublishYear: 2005,
  },
  {
    title: "No, David!",
    author: "David Shannon",
    source: "open_library",
    sourceId: "/works/OL2W",
  },
  {
    title: "The Rabbit Listened",
    author: "Cori Doerrfeld",
    source: "open_library",
    sourceId: "/works/OL3W",
  },
  {
    title: "Grumpy Monkey",
    author: "Suzanne Lang",
    source: "open_library",
    sourceId: "/works/OL4W",
  },
  {
    title: "How Do Dinosaurs Get Well Soon?",
    author: "Jane Yolen",
    source: "open_library",
    sourceId: "/works/OL5W",
  },
];

test("generator prompt includes behavior guidance and all reference books", () => {
  const prompt = buildStoryConceptGeneratorPrompt({
    behavior,
    referenceBooks,
    count: 3,
  });

  assert.match(prompt, /Refusing to get dressed/);
  assert.match(prompt, /morning bedroom/);
  assert.match(prompt, /Montessori-style freedom within limits/);
  assert.match(prompt, /Do not yell, shame/);
  for (const book of referenceBooks) {
    assert.match(prompt, new RegExp(book.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(prompt, new RegExp(book.author.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("generator prompt requires placeholders and forbids copied book expression", () => {
  const prompt = buildStoryConceptGeneratorPrompt({
    behavior,
    referenceBooks,
    count: 3,
    previousFailures: ["Parent gave a reward before the desired behavior."],
  });

  assert.match(prompt, /\{child_name\}/);
  assert.match(prompt, /\{parent_name\}/);
  assert.match(prompt, /Do not copy text, character names, distinctive scenes/);
  assert.match(prompt, /Parent gave a reward before the desired behavior/);
});

test("judge prompt is separate and rejects unsafe or generic concepts", () => {
  const prompt = buildStoryConceptJudgePrompt({
    behavior,
    referenceBooks,
    concept: {
      title: "The Pants Parade",
      coreTheme: "Getting dressed with choices",
      story: "{child_name} hides under the blanket.",
      endingMessage: "Getting dressed feels easier with small choices.",
      placeholders: ["{child_name}", "{parent_name}"],
    },
  });

  assert.match(prompt, /separate, harsh story QA judge/);
  assert.match(prompt, /valid JSON only/);
  assert.match(prompt, /parent action makes expert sense/);
  assert.match(prompt, /child makes believable progress/);
  assert.match(prompt, /unsafe, gross, strange, or nonsensical/);
  assert.match(prompt, /Chasing a child as the solution/);
});

test("normalizes story concept candidates and adds required placeholders", () => {
  const candidates = normalizeStoryConceptCandidates({
    concepts: [
      {
        title: "The Pants Parade",
        coreTheme: "Getting dressed",
        story: "{child_name} looked at the pants.",
        endingMessage: "Small choices help mornings move.",
        placeholders: ["{child_name}"],
        toolsOrRituals: ["pants parade"],
        inspiredBy: ["No, David!"],
      },
      { title: "Incomplete" },
    ],
  });

  assert.equal(candidates.length, 1);
  assert.deepEqual(candidates[0]?.placeholders, [
    "{child_name}",
    "{parent_name}",
  ]);
});

test("normalizes judge review and requires threshold for pass", () => {
  assert.deepEqual(
    normalizeJudgeReview({
      pass: true,
      score: 7.5,
      reasons: ["Too generic"],
      requiredFixes: ["Show the parent action"],
      safetyFlags: ["unsafe choice"],
    }),
    {
      pass: false,
      score: 7.5,
      rating: "bad",
      reasons: ["Too generic"],
      requiredFixes: ["Show the parent action"],
      safetyFlags: ["unsafe choice"],
    },
  );
});
