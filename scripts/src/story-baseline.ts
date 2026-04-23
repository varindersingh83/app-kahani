import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type StoryMode = "behavior" | "random";

type CharacterInput = {
  name: string;
  photoUri: string;
};

type SupportingCharacterInput = {
  name: string;
  relationship: string;
};

type StoryRequest = {
  mode: StoryMode;
  prompt: string;
  character: CharacterInput;
  supportingCharacters: SupportingCharacterInput[];
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
};

type BaselineCase = {
  id: string;
  description: string;
  request: StoryRequest;
};

const repoRoot = path.resolve(import.meta.dirname, "../..");
const downloadsDir = "/Users/varindernagra/Downloads";
const apiBaseUrl = process.env.API_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const outputDir =
  process.env.BASELINE_OUTPUT_DIR ??
  path.join(repoRoot, "artifacts", "baseline-books", new Date().toISOString().replace(/[:.]/g, "-"));

const family = {
  dad: {
    name: "Dad",
    relationship: "dad",
    photoUri: path.join(downloadsDir, "selfie male.png"),
  },
  mom: {
    name: "Mom",
    relationship: "mom",
    photoUri: path.join(downloadsDir, "selfie female.png"),
  },
  liam: {
    name: "Liam",
    relationship: "brother",
    photoUri: path.join(downloadsDir, "boy 3.png"),
  },
  emma: {
    name: "Emma",
    relationship: "sister",
    photoUri: path.join(downloadsDir, "girl 3.png"),
  },
} satisfies Record<string, CharacterInput & { relationship: string }>;

const baselineCases: BaselineCase[] = [
  {
    id: "liam-behavior-sharing",
    description: "Behavior support for Liam practicing sharing with Emma.",
    request: {
      mode: "behavior",
      prompt:
        "Liam is learning to share toys with Emma without grabbing. Help him notice his big feelings, ask for a turn, and feel proud when they play together.",
      character: { name: family.liam.name, photoUri: family.liam.photoUri },
      supportingCharacters: [
        { name: family.emma.name, relationship: family.emma.relationship },
        { name: family.mom.name, relationship: family.mom.relationship },
        { name: family.dad.name, relationship: family.dad.relationship },
      ],
    },
  },
  {
    id: "emma-behavior-bedtime",
    description: "Behavior support for Emma winding down at bedtime.",
    request: {
      mode: "behavior",
      prompt:
        "Emma has trouble stopping play when it is bedtime. Help her move through the bedtime routine with warmth, choice, and calm confidence.",
      character: { name: family.emma.name, photoUri: family.emma.photoUri },
      supportingCharacters: [
        { name: family.liam.name, relationship: family.liam.relationship },
        { name: family.mom.name, relationship: family.mom.relationship },
        { name: family.dad.name, relationship: family.dad.relationship },
      ],
    },
  },
  {
    id: "liam-random-moon-garden",
    description: "Random imaginative story for Liam.",
    request: {
      mode: "random",
      prompt:
        "A cozy adventure where Liam discovers a tiny moon garden under the kitchen table and helps glowing seeds find their way home.",
      character: { name: family.liam.name, photoUri: family.liam.photoUri },
      supportingCharacters: [
        { name: family.emma.name, relationship: family.emma.relationship },
        { name: family.mom.name, relationship: family.mom.relationship },
        { name: family.dad.name, relationship: family.dad.relationship },
      ],
    },
  },
  {
    id: "emma-random-seaside-bakery",
    description: "Random imaginative story for Emma.",
    request: {
      mode: "random",
      prompt:
        "A sweet seaside bakery adventure where Emma, Liam, Mom, and Dad make cloud-shaped buns for a windy beach picnic.",
      character: { name: family.emma.name, photoUri: family.emma.photoUri },
      supportingCharacters: [
        { name: family.liam.name, relationship: family.liam.relationship },
        { name: family.mom.name, relationship: family.mom.relationship },
        { name: family.dad.name, relationship: family.dad.relationship },
      ],
    },
  },
];

function markdownForStory(testCase: BaselineCase, story: GeneratedStory) {
  const pages = story.pages
    .map(
      (page) => `### Page ${page.pageNumber}

${page.text}

Illustration prompt: ${page.illustrationPrompt}`,
    )
    .join("\n\n");

  return `# ${story.title}

Case: ${testCase.id}

${testCase.description}

Mode: ${testCase.request.mode}

Prompt: ${testCase.request.prompt}

Main character: ${testCase.request.character.name}

Supporting characters: ${testCase.request.supportingCharacters
    .map((character) => `${character.name} (${character.relationship})`)
    .join(", ")}

Cover image: ${story.coverImageUrl ?? "none"}

${pages}

## Reflection

${story.reflectionQuestion}
`;
}

async function generateStory(testCase: BaselineCase) {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/stories/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testCase.request),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${testCase.id} failed with ${response.status}: ${body}`);
  }

  return (await response.json()) as GeneratedStory;
}

function selectedCases() {
  const onlyArg = process.argv.find((arg) => arg.startsWith("--case="));
  if (!onlyArg) return baselineCases;

  const selectedIds = new Set(onlyArg.slice("--case=".length).split(","));
  return baselineCases.filter((testCase) => selectedIds.has(testCase.id));
}

async function main() {
  const cases = selectedCases();
  if (cases.length === 0) {
    throw new Error(`No baseline cases selected. Available cases: ${baselineCases.map((testCase) => testCase.id).join(", ")}`);
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "requests.json"), `${JSON.stringify(cases, null, 2)}\n`);

  const summaries: string[] = [];
  for (const testCase of cases) {
    console.log(`Generating ${testCase.id}...`);
    const story = await generateStory(testCase);

    await writeFile(path.join(outputDir, `${testCase.id}.json`), `${JSON.stringify(story, null, 2)}\n`);
    await writeFile(path.join(outputDir, `${testCase.id}.md`), markdownForStory(testCase, story));

    summaries.push(
      `- ${testCase.id}: "${story.title}" (${story.pages.length} pages, cover: ${story.coverImageUrl ? "yes" : "no"})`,
    );
  }

  await writeFile(
    path.join(outputDir, "summary.md"),
    `# Story Baseline

API base URL: ${apiBaseUrl}

Generated at: ${new Date().toISOString()}

${summaries.join("\n")}
`,
  );

  console.log(`Baseline written to ${outputDir}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
