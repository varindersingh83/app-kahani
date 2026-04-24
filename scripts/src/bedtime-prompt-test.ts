import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type BehaviorPrompt = {
  id: string;
  prompt: string;
};

type StoryPage = {
  pageNumber: number;
  text: string;
  illustrationPrompt: string;
};

type GeneratedStory = {
  title: string;
  pages: StoryPage[];
  reflectionQuestion: string;
  coverImageUrl?: string;
  sheetImageUrl?: string;
};

type PromptRunRequest = {
  mode: "behavior";
  childName: string;
  behaviorPrompt: string;
  composedPrompt: string;
  parentName: string;
  parentRelationship: string;
  character: {
    name: string;
    photoUri: string;
  };
  supportingCharacters: Array<{
    name: string;
    relationship: string;
  }>;
};

const repoRoot = path.resolve(import.meta.dirname, "../..");
const promptBankPath = path.join(repoRoot, "scripts", "data", "behavior-prompts.json");
const masterPromptPath = path.join(repoRoot, "scripts", "data", "bedtime-master-prompt.txt");
const outputDir =
  process.env.BEDTIME_PROMPT_TEST_OUTPUT_DIR ??
  path.join(repoRoot, "artifacts", "bedtime-prompt-runs", new Date().toISOString().replace(/[:.]/g, "-"));
const childName = process.env.BEDTIME_PROMPT_TEST_CHILD_NAME ?? "Liam";
const childPhotoUri =
  process.env.BEDTIME_PROMPT_TEST_CHILD_PHOTO ??
  path.join(repoRoot, "attached_assets", "boy_3_1776840248076.png");
const parentName = process.env.BEDTIME_PROMPT_TEST_PARENT_NAME ?? "Mom";
const parentRelationship = process.env.BEDTIME_PROMPT_TEST_PARENT_RELATIONSHIP ?? "parent";

async function loadBehaviorPrompts() {
  const raw = await readFile(promptBankPath, "utf8");
  return JSON.parse(raw) as BehaviorPrompt[];
}

async function loadMasterPrompt() {
  const raw = await readFile(masterPromptPath, "utf8");
  return raw.replace(/^MASTER PROMPT TEMPLATE\s*\n\n/, "");
}

function buildComposedPrompt(masterPrompt: string, behaviorPrompt: string, childNameValue: string) {
  return masterPrompt
    .replace("[INSERT BEHAVIOR]", behaviorPrompt)
    .replace("[CHILD_NAME]", childNameValue);
}

function buildTitle(childNameValue: string, behaviorPrompt: string) {
  const prompt = behaviorPrompt.toLowerCase();
  if (/(hit|bite|pull|push|throw)/.test(prompt)) {
    return `${childNameValue} and the Gentle Hands`;
  }
  if (/(tantrum|scream|cry|meltdown)/.test(prompt)) {
    return `${childNameValue} and the Soft Breath`;
  }
  if (/(share|wait|turn|grab)/.test(prompt)) {
    return `${childNameValue} and the Waiting Turn`;
  }
  return `${childNameValue} and the Quiet Try`;
}

function buildReflectionQuestion(behaviorPrompt: string, childNameValue: string) {
  const prompt = behaviorPrompt.toLowerCase();
  if (/(hit|bite|pull|push|throw)/.test(prompt)) {
    return `What can ${childNameValue} do with their hands when they feel upset?`;
  }
  if (/(tantrum|scream|cry|meltdown)/.test(prompt)) {
    return `What can ${childNameValue} do when the big feeling grows?`;
  }
  if (/(share|wait|turn|grab)/.test(prompt)) {
    return `What can ${childNameValue} say when they want a turn?`;
  }
  return `What gentle step can ${childNameValue} try next time?`;
}

function buildParentTakeaway(behaviorPrompt: string) {
  const prompt = behaviorPrompt.toLowerCase();
  if (/(hit|bite|pull|push|throw)/.test(prompt)) {
    return "Stay calm, protect the body, and coach gentle hands with a simple repeatable phrase.";
  }
  if (/(tantrum|scream|cry|meltdown)/.test(prompt)) {
    return "Keep your voice low, name the feeling, and guide the child back to calm.";
  }
  if (/(share|wait|turn|grab)/.test(prompt)) {
    return "Name the want, set the limit, and offer a short wait with connection.";
  }
  return "Stay steady, name the moment, and show one small calm next step.";
}

function buildStory(childNameValue: string, behaviorPrompt: string): GeneratedStory {
  const pages: StoryPage[] = [
    {
      pageNumber: 1,
      text: `${childNameValue} plays on the rug with the blocks. The room is soft and warm.`,
      illustrationPrompt: `Watercolor scene of ${childNameValue} on a cozy rug with blocks, warm home light, calm bedtime feeling.`,
    },
    {
      pageNumber: 2,
      text: `A small bump happens. ${childNameValue} feels a hot puff of upset.`,
      illustrationPrompt: `Watercolor scene of a small toy bump or block wobble, ${childNameValue} looking surprised and upset.`,
    },
    {
      pageNumber: 3,
      text: `${childNameValue} reaches fast. The hands feel ready to ${behaviorPrompt.toLowerCase().startsWith("hitting") ? "hit" : "move"}.`,
      illustrationPrompt: `Watercolor scene of ${childNameValue} with tense hands and a worried face, the moment just before acting.`,
    },
    {
      pageNumber: 4,
      text: `Mom comes close. She stays calm and low and says, "I see your big feeling."`,
      illustrationPrompt: `Watercolor scene of a calm parent kneeling beside ${childNameValue}, gentle face, quiet room.`,
    },
    {
      pageNumber: 5,
      text: `Mom holds out a hand. "Hands stay gentle. We can step back."`,
      illustrationPrompt: `Watercolor scene of parent showing a gentle hand and a small step back, reassuring and calm.`,
    },
    {
      pageNumber: 6,
      text: `${childNameValue} breathes in. ${childNameValue} breathes out. The hot puff gets a little smaller.`,
      illustrationPrompt: `Watercolor scene of ${childNameValue} taking slow breaths, shoulders easing, soft light around them.`,
    },
    {
      pageNumber: 7,
      text: `${childNameValue} tucks the hands close and says, "Mine next," in a small voice.`,
      illustrationPrompt: `Watercolor scene of ${childNameValue} using words instead of rough hands, quiet and careful.`,
    },
    {
      pageNumber: 8,
      text: `The other child waits. The blocks stay on the rug. The room feels steadier.`,
      illustrationPrompt: `Watercolor scene of two children near blocks, the moment calm and still, no tension.`,
    },
    {
      pageNumber: 9,
      text: `${childNameValue} is still wiggly inside, but the hands stay gentle.`,
      illustrationPrompt: `Watercolor scene of ${childNameValue} looking wiggly but calm, hands resting safely by the body.`,
    },
    {
      pageNumber: 10,
      text: `${childNameValue} tries again. A slow breath helps the next choice come out softly.`,
      illustrationPrompt: `Watercolor scene of ${childNameValue} trying again with a slow breath, gentle and hopeful.`,
    },
    {
      pageNumber: 11,
      text: `At bedtime, Mom rocks ${childNameValue} in the dim room. The day grows quiet.`,
      illustrationPrompt: `Watercolor bedtime scene with parent rocking ${childNameValue} under a blanket, soft lamp glow.`,
    },
    {
      pageNumber: 12,
      text: `${childNameValue} feels safe and close. Tomorrow can try again.`,
      illustrationPrompt: `Watercolor scene of ${childNameValue} tucked in safely, peaceful room, cozy and calm.`,
    },
  ];

  return {
    title: buildTitle(childNameValue, behaviorPrompt),
    pages,
    reflectionQuestion: buildReflectionQuestion(behaviorPrompt, childNameValue),
  };
}

function markdownForStory(testId: string, request: PromptRunRequest, story: GeneratedStory, parentTakeaway: string) {
  const pages = story.pages
    .map(
      (page) => `### Page ${page.pageNumber}\n\n${page.text}\n\nIllustration note: ${page.illustrationPrompt}`,
    )
    .join("\n\n");

  return `# ${story.title}

Test: ${testId}

Child: ${request.childName}

Behavior prompt: ${request.behaviorPrompt}

Parent takeaway: ${parentTakeaway}

${pages}

## Reflection

${story.reflectionQuestion}
`;
}

async function main() {
  const prompts = await loadBehaviorPrompts();
  const masterPrompt = await loadMasterPrompt();
  const selected = prompts[0];

  if (!selected) {
    throw new Error("No behavior prompts found.");
  }

  const composedPrompt = buildComposedPrompt(masterPrompt, selected.prompt, childName);
  const request: PromptRunRequest = {
    mode: "behavior",
    childName,
    behaviorPrompt: selected.prompt,
    composedPrompt,
    parentName,
    parentRelationship,
    character: {
      name: childName,
      photoUri: childPhotoUri,
    },
    supportingCharacters: [
      {
        name: parentName,
        relationship: parentRelationship,
      },
    ],
  };

  const story = buildStory(request.childName, request.behaviorPrompt);
  const parentTakeaway = buildParentTakeaway(request.behaviorPrompt);
  const runDir = path.join(outputDir, selected.id);

  await mkdir(runDir, { recursive: true });
  await writeFile(path.join(runDir, "request.json"), `${JSON.stringify(request, null, 2)}\n`);
  await writeFile(path.join(runDir, "selected-prompt.json"), `${JSON.stringify(selected, null, 2)}\n`);
  await writeFile(path.join(runDir, "composed-prompt.txt"), `${composedPrompt}\n`);
  await writeFile(path.join(runDir, "story.json"), `${JSON.stringify(story, null, 2)}\n`);
  await writeFile(path.join(runDir, "story.md"), `${markdownForStory(selected.id, request, story, parentTakeaway)}\n`);
  await writeFile(path.join(runDir, "summary.txt"), `Story title: ${story.title}\nPages: ${story.pages.length}\n`);

  console.log(`Running prompt: ${selected.id}`);
  console.log(`Output directory: ${runDir}`);
  console.log(`Story title: ${story.title}`);
  console.log(`Pages: ${story.pages.length}`);
  console.log(`Saved story: ${path.join(runDir, "story.md")}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
