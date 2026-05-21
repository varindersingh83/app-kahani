import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const outputRoot = path.join(
  repoRoot,
  "artifacts",
  "story-generation-smoke",
  new Date().toISOString().replace(/[:.]/g, "-"),
);

const behavior =
  process.env.STORY_SMOKE_BEHAVIOR ?? "Emma will not eat her dinner.";
const childName = process.env.STORY_SMOKE_CHILD_NAME ?? "Emma";
const parentName = process.env.STORY_SMOKE_PARENT_NAME ?? "Mom";
const childIdentity =
  process.env.STORY_SMOKE_CHILD_IDENTITY ??
  "Child identity lock: preschool girl with brown hair, warm brown skin, and a purple shirt. Keep the main child consistent.";

await loadDotenv(path.join(repoRoot, ".env"));

const baseUrl =
  process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL ??
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const apiKey =
  process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY ??
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const textModel =
  process.env.AI_INTEGRATIONS_OPENROUTER_MODEL ??
  process.env.AI_INTEGRATIONS_OPENAI_MODEL ??
  "openai/gpt-5.4-nano";

const template = await readFile(
  path.join(repoRoot, "scripts", "data", "story-json-master-prompt.txt"),
  "utf8",
);
const storyPrompt = template
  .replaceAll("{{BEHAVIOR}}", behavior)
  .replaceAll("{{CHILD_NAME}}", childName)
  .replaceAll("{{PARENT_NAME}}", parentName)
  .replaceAll("{{CHILD_IDENTITY}}", childIdentity);

if (isTruthy(process.env.STORY_SMOKE_OFFLINE)) {
  const story = buildOfflineStory({ behavior, childName, parentName });
  await writeSmokeOutput({ storyPrompt, story, model: "offline-rule-smoke" });
  printStory(story);
  process.exit(0);
}

if (!baseUrl || !apiKey) {
  throw new Error(
    "AI credentials are missing. Set AI_INTEGRATIONS_OPENROUTER_BASE_URL and AI_INTEGRATIONS_OPENROUTER_API_KEY.",
  );
}

const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...(process.env.OPENROUTER_SITE_URL
      ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL }
      : {}),
    ...(process.env.OPENROUTER_APP_TITLE
      ? { "X-OpenRouter-Title": process.env.OPENROUTER_APP_TITLE }
      : {}),
  },
  body: JSON.stringify({
    model: textModel,
    max_completion_tokens: 3000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You write exact JSON only. Follow the user's schema and return valid JSON with no markdown or explanation.",
      },
      { role: "user", content: storyPrompt },
    ],
  }),
});

if (!response.ok) {
  throw new Error(
    `Story JSON request failed with ${response.status}: ${await response.text()}`,
  );
}

const data = await response.json();
const content = data.choices?.[0]?.message?.content;
if (!content) throw new Error("Story JSON request returned empty content.");

const story = extractJson(content);
await writeSmokeOutput({
  storyPrompt,
  story,
  model: textModel,
  usage: data.usage ?? null,
});

printStory(story);

function printStory(story) {
  console.log(`Output dir: ${outputRoot}`);
  console.log(`Title: ${story.title}`);
  console.log(`Pages: ${story.pages?.length ?? "n/a"}`);
  console.log(`Behavior: ${story.behavior}`);
  for (const page of story.pages ?? []) {
    console.log(`${page.page}. ${page.text}`);
  }
}

async function writeSmokeOutput({ storyPrompt, story, model, usage = null }) {
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "story-prompt.txt"), `${storyPrompt}\n`);
  await writeFile(
    path.join(outputRoot, "story.json"),
    `${JSON.stringify(story, null, 2)}\n`,
  );
  await writeFile(
    path.join(outputRoot, "usage.json"),
    `${JSON.stringify({ model, usage }, null, 2)}\n`,
  );
}

function buildOfflineStory({ behavior, childName, parentName }) {
  const lower = behavior.toLowerCase();
  if (lower.includes("eat") || lower.includes("food") || lower.includes("dinner")) {
    return {
      title: `${childName} Tries One Bite`,
      child_name: childName,
      parent_name: parentName,
      parent_role: "parent",
      behavior,
      pages: [
        {
          page: 1,
          text: `${childName} sat at the table with one knee tucked up.`,
          scene: "A preschool child sits at a kitchen table beside a small plate of food.",
          composition: "medium shot",
          emotion: "stuck",
        },
        {
          page: 2,
          text: `"No dinner," ${childName} said.`,
          scene: "The child turns slightly away from the plate while the parent sits nearby.",
          composition: "medium shot",
          emotion: "resistant",
        },
        {
          page: 3,
          text: `${parentName} put a tiny piece near the edge of the plate.`,
          scene: "The parent calmly places one small bite at the edge of the plate.",
          composition: "close-up",
          emotion: "calm",
        },
        {
          page: 4,
          text: `"One bite, then fruit," ${parentName} said.`,
          scene: "The parent points gently to the small bite and a small bowl of fruit nearby.",
          composition: "medium shot",
          emotion: "clear",
        },
        {
          page: 5,
          text: `${childName} touched the bite with one finger.`,
          scene: "The child reaches toward the small bite while still looking unsure.",
          composition: "close-up",
          emotion: "unsure",
        },
        {
          page: 6,
          text: `Then ${childName} put it in and chewed slow.`,
          scene: "The child takes the small bite while the parent waits quietly.",
          composition: "medium shot",
          emotion: "trying",
        },
        {
          page: 7,
          text: `${parentName} slid the fruit bowl close.`,
          scene: "The parent moves the fruit bowl toward the child after the bite is finished.",
          composition: "medium shot",
          emotion: "relieved",
        },
        {
          page: 8,
          text: `${childName} ate a berry and stayed at the table.`,
          scene: "The child eats a berry at the table with the dinner plate still nearby.",
          composition: "wide shot",
          emotion: "settled",
        },
      ],
    };
  }

  return {
    title: `${childName} Tries the Next Step`,
    child_name: childName,
    parent_name: parentName,
    parent_role: "parent",
    behavior,
    pages: [
      {
        page: 1,
        text: `${childName} wanted the moment to stay the same.`,
        scene: "A preschool child holds onto an everyday object in a family room.",
        composition: "medium shot",
        emotion: "stuck",
      },
      {
        page: 2,
        text: `${parentName} came close and named the next step.`,
        scene: "The parent kneels near the child and gestures toward the next place to go.",
        composition: "medium shot",
        emotion: "clear",
      },
      {
        page: 3,
        text: `"This way or that way?" ${parentName} asked.`,
        scene: "The parent offers two safe paths that both lead to the same next step.",
        composition: "wide shot",
        emotion: "curious",
      },
      {
        page: 4,
        text: `${childName} frowned and picked one.`,
        scene: "The child points to one option while still frowning.",
        composition: "close-up",
        emotion: "mixed",
      },
      {
        page: 5,
        text: `One small step came first.`,
        scene: "The child's foot moves toward the next activity.",
        composition: "close-up",
        emotion: "trying",
      },
      {
        page: 6,
        text: `Then another.`,
        scene: "The child takes another small step with the parent nearby.",
        composition: "medium shot",
        emotion: "braver",
      },
      {
        page: 7,
        text: `${parentName} waited at the end.`,
        scene: "The parent waits calmly at the destination.",
        composition: "wide shot",
        emotion: "patient",
      },
      {
        page: 8,
        text: `${childName} got there, still a little mad.`,
        scene: "The child reaches the destination and leans gently against the parent.",
        composition: "medium shot",
        emotion: "settled",
      },
    ],
  };
}

function isTruthy(value) {
  return /^(1|true|yes)$/i.test(String(value ?? "").trim());
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return valid JSON.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

async function loadDotenv(filePath) {
  let raw = "";
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;
    const key = trimmed.slice(0, equals).trim();
    let value = trimmed.slice(equals + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
