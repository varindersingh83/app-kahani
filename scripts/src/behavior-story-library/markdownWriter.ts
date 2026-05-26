import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildLibrary,
  slugifyBehavior,
  validateLibraryRecord,
  type BehaviorStoryLibrary,
  type BehaviorStoryLibraryRecord,
  type StoryConcept,
} from "./types";

export function markdownFileFor(sourceRow: number, behaviorIssue: string) {
  return `markdown/${slugifyBehavior(sourceRow, behaviorIssue)}.md`;
}

export function renderIssueMarkdown(record: BehaviorStoryLibraryRecord) {
  return [
    `# ${record.behaviorIssue}`,
    "",
    ...record.storyConcepts.flatMap((concept, index) =>
      renderConceptMarkdown(concept, index + 1),
    ),
  ].join("\n").trimEnd() + "\n";
}

export async function writeBehaviorStoryLibraryArtifacts(input: {
  outputDir: string;
  records: BehaviorStoryLibraryRecord[];
  generatedAt?: string;
}) {
  const markdownDir = path.join(input.outputDir, "markdown");
  await mkdir(markdownDir, { recursive: true });

  for (const record of input.records) {
    const errors = validateLibraryRecord(record);
    if (errors.length) {
      throw new Error(
        `Invalid behavior story library record ${record.categoryId}: ${errors.join(" ")}`,
      );
    }
    const markdownPath = safeMarkdownPath(input.outputDir, record.markdownFile);
    await mkdir(path.dirname(markdownPath), { recursive: true });
    await writeFile(markdownPath, renderIssueMarkdown(record), "utf8");
  }

  const library: BehaviorStoryLibrary = {
    ...buildLibrary(input.records),
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  };
  const jsonPath = path.join(input.outputDir, "behavior-story-library.json");
  await writeFile(jsonPath, `${JSON.stringify(library, null, 2)}\n`, "utf8");
  return { library, jsonPath, markdownDir };
}

export function buildRecordForMarkdown(input: {
  sourceRow: number;
  categoryId: string;
  behaviorIssue: string;
  referenceBooks: BehaviorStoryLibraryRecord["referenceBooks"];
  storyConcepts: StoryConcept[];
  generationStatus: BehaviorStoryLibraryRecord["generationStatus"];
}): BehaviorStoryLibraryRecord {
  const slug = slugifyBehavior(input.sourceRow, input.behaviorIssue);
  return {
    sourceRow: input.sourceRow,
    categoryId: input.categoryId,
    behaviorIssue: input.behaviorIssue,
    slug,
    markdownFile: `markdown/${slug}.md`,
    referenceBooks: input.referenceBooks,
    storyConcepts: input.storyConcepts,
    generationStatus: input.generationStatus,
  };
}

function renderConceptMarkdown(concept: StoryConcept, index: number) {
  const tools = concept.toolsOrRituals?.length
    ? [
        "Optional repeated tools/rituals:",
        ...concept.toolsOrRituals.map((tool) => `* ${tool}`),
        "",
      ]
    : [];
  return [
    `## ${index}. ${concept.title}`,
    "",
    `**Core theme:** ${concept.coreTheme}`,
    "",
    concept.story.trim(),
    "",
    ...tools,
    `**Ending message:** ${concept.endingMessage}`,
    "",
  ];
}

function safeMarkdownPath(outputDir: string, markdownFile: string) {
  if (!markdownFile.startsWith("markdown/")) {
    throw new Error(`Markdown file must be under markdown/: ${markdownFile}`);
  }
  const root = path.resolve(outputDir, "markdown");
  const target = path.resolve(outputDir, markdownFile);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Markdown file escapes output directory: ${markdownFile}`);
  }
  return target;
}
