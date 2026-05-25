import type { BehaviorTemplate, ReferenceBook, StoryConcept } from "./types";

export type StoryConceptCandidate = Omit<StoryConcept, "qa">;

export function buildStoryConceptGeneratorPrompt(input: {
  behavior: BehaviorTemplate;
  referenceBooks: ReferenceBook[];
  count: number;
  previousFailures?: string[];
}) {
  const { behavior } = input;
  return [
    "You are a celebrated children's story concept author for ages 2-6 and an expert in positive child development.",
    "Generate short narrative story concepts only. Do not write a 12-page manuscript yet.",
    "",
    "Behavior issue data:",
    `- BEHAVIOR ISSUE: ${behavior.visibleBehavior}`,
    `- SETTING: ${behavior.scene}`,
    `- LIKELY CAUSE: ${behavior.mechanism}`,
    `- RECOMMENDED ACTION: ${behavior.strategy}`,
    `- PARENT GUIDANCE: ${behavior.parentGuidance}`,
    `- AVOID DOING: ${behavior.avoidDoing ?? "Do not yell, shame, threaten, hit, over-explain during peak distress, or reward the problem behavior."}`,
    `- POSITIVE RESOLUTION: ${behavior.targetOutcome}`,
    `- CHILD STORY SKILL: ${behavior.childStorySkill}`,
    "",
    "Real published children's books to use as broad inspiration only:",
    ...input.referenceBooks.map(
      (book, index) =>
        `${index + 1}. ${book.title} by ${book.author}${
          book.firstPublishYear ? ` (${book.firstPublishYear})` : ""
        }`,
    ),
    "",
    "Reference-book rules:",
    "- Use these books only for broad pattern inspiration: emotional arc, pacing, tone, child-scale conflict, and satisfying resolution.",
    "- Do not copy text, character names, distinctive scenes, proprietary phrasing, or plot beats from the reference books.",
    "- The story concept must be original and grounded in the behavior issue data above.",
    "",
    "Story concept format:",
    `- Return exactly ${input.count} story concepts.`,
    "- Each concept must have: title, coreTheme, story, toolsOrRituals, endingMessage, placeholders, inspiredBy.",
    "- The story field should be a short narrative concept, similar to 8-12 compact paragraphs, not page-by-page text.",
    "- Use child-facing imagery, sensory detail, and one memorable object, ritual, or phrase.",
    "- The parent action must make practical expert sense for this behavior and must visibly avoid the AVOID DOING guidance.",
    "- The child must make believable progress through one visible replacement action.",
    "- Use placeholders instead of fixed names: include {child_name} and {parent_name}.",
    "- Optional sibling or object placeholders are okay only when needed, but do not require them.",
    "- Do not make the story sound like a parenting article, lesson plan, or therapy script.",
    "",
    ...(input.previousFailures?.length
      ? [
          "Avoid repeating these previous QA failures:",
          ...input.previousFailures.map((failure) => `- ${failure}`),
          "",
        ]
      : []),
    "Return valid JSON only with this exact shape:",
    JSON.stringify(
      {
        concepts: [
          {
            title: "The Thunder Inside {child_name}",
            coreTheme: "Emotional regulation, frustration, safe expression",
            story:
              "{child_name} loves building tall block towers. One day the tower crashes, and a storm rises inside...",
            toolsOrRituals: ["dragon breaths", "squeeze a pillow"],
            endingMessage:
              "Big feelings are not bad. Feelings pass faster when they are understood.",
            placeholders: ["{child_name}", "{parent_name}"],
            inspiredBy: ["Reference Book Title"],
          },
        ],
      },
      null,
      2,
    ),
  ].join("\n");
}

export function buildStoryConceptJudgePrompt(input: {
  behavior: BehaviorTemplate;
  referenceBooks: ReferenceBook[];
  concept: StoryConceptCandidate;
}) {
  const { behavior, concept } = input;
  return [
    "You are a separate, harsh story QA judge for Kahani. You did not write this story concept.",
    "Return valid JSON only. Be picky like a parent reviewing whether the story actually helps.",
    "",
    "Behavior issue data:",
    `- BEHAVIOR ISSUE: ${behavior.visibleBehavior}`,
    `- SETTING: ${behavior.scene}`,
    `- LIKELY CAUSE: ${behavior.mechanism}`,
    `- RECOMMENDED ACTION: ${behavior.strategy}`,
    `- PARENT GUIDANCE: ${behavior.parentGuidance}`,
    `- AVOID DOING: ${behavior.avoidDoing ?? "Do not yell, shame, threaten, hit, over-explain during peak distress, or reward the problem behavior."}`,
    `- POSITIVE RESOLUTION: ${behavior.targetOutcome}`,
    "",
    "Reference books used for broad inspiration only:",
    ...input.referenceBooks.map((book) => `- ${book.title} by ${book.author}`),
    "",
    "Story concept to judge:",
    JSON.stringify(concept, null, 2),
    "",
    "Pass only if all of these are true:",
    "- The concept reads like a real child-facing story scene, not generic parenting advice.",
    "- The parent action makes expert sense for the exact behavior issue.",
    "- The parent visibly avoids unsafe, shaming, yelling, threatening, hitting, over-explaining, giving in, or rewarding the problem behavior.",
    "- The child makes believable progress through one visible replacement action.",
    "- The ending is earned and emotionally satisfying.",
    "- The story uses placeholders such as {child_name} and {parent_name}, not fixed child names.",
    "- The story is original and does not copy text, distinctive scenes, or proprietary expression from the reference books.",
    "- The story avoids unsafe, gross, strange, or nonsensical details.",
    "",
    "Reject even small practical parenting mistakes. Examples:",
    "- Choices where one option leaves the problem behavior unresolved.",
    "- A reward before the desired behavior happens.",
    "- Chasing a child as the solution.",
    "- Letting a child smell urine, hit back, or do something unsafe.",
    "- A parent response that belongs to a different routine than the behavior issue.",
    "- A poetic line that sounds cute but does not change the behavior.",
    "",
    "Return this exact JSON shape:",
    JSON.stringify(
      {
        pass: true,
        score: 9,
        rating: "good",
        reasons: ["Why this passes or fails."],
        requiredFixes: ["Specific fixes required if it fails."],
        safetyFlags: [],
      },
      null,
      2,
    ),
  ].join("\n");
}

export function normalizeStoryConceptCandidates(value: unknown): StoryConceptCandidate[] {
  const concepts = asObject(value).concepts;
  if (!Array.isArray(concepts)) return [];
  return concepts.map(normalizeConcept).filter(isConceptCandidate);
}

export function normalizeJudgeReview(value: unknown) {
  const data = asObject(value);
  const score = clampScore(Number(data.score ?? 0));
  const pass = data.pass === true && score >= 8.5;
  return {
    pass,
    score,
    rating: pass ? "good" as const : "bad" as const,
    reasons: stringArray(data.reasons),
    requiredFixes: stringArray(data.requiredFixes),
    safetyFlags: stringArray(data.safetyFlags),
  };
}

function normalizeConcept(value: unknown): StoryConceptCandidate | null {
  const data = asObject(value);
  const title = stringValue(data.title);
  const coreTheme = stringValue(data.coreTheme);
  const story = stringValue(data.story);
  const endingMessage = stringValue(data.endingMessage);
  if (!title || !coreTheme || !story || !endingMessage) return null;
  return {
    title,
    coreTheme,
    story,
    endingMessage,
    toolsOrRituals: stringArray(data.toolsOrRituals),
    placeholders: ensurePlaceholders(stringArray(data.placeholders)),
    inspiredBy: stringArray(data.inspiredBy),
  };
}

function isConceptCandidate(
  concept: StoryConceptCandidate | null,
): concept is StoryConceptCandidate {
  return concept !== null;
}

function ensurePlaceholders(placeholders: string[]) {
  return [...new Set([...placeholders, "{child_name}", "{parent_name}"])];
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string").map(
    (entry) => entry.trim(),
  ).filter(Boolean);
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, value));
}
