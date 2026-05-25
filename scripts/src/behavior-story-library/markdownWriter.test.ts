import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildRecordForMarkdown,
  markdownFileFor,
  renderIssueMarkdown,
  writeBehaviorStoryLibraryArtifacts,
} from "./markdownWriter";
import { buildGenerationStatus, type ReferenceBook, type StoryConcept } from "./types";

const referenceBooks: ReferenceBook[] = Array.from({ length: 5 }, (_, index) => ({
  title: `Reference Book ${index + 1}`,
  author: `Author ${index + 1}`,
  source: "open_library",
  sourceId: `/works/OL${index + 1}W`,
}));

const qa = {
  pass: true,
  score: 9,
  rating: "good" as const,
  reasons: ["Expert-aligned parent action."],
  requiredFixes: [],
  safetyFlags: [],
};

function concept(title: string): StoryConcept {
  return {
    title,
    coreTheme: "Transitions, frustration tolerance",
    story:
      "{child_name} loved the slide.\n\n{parent_name} gave a warning and stayed close.",
    toolsOrRituals: ["five-minute warning", "wave goodbye"],
    endingMessage: "Transitions feel safer when children feel prepared.",
    placeholders: ["{child_name}", "{parent_name}"],
    qa,
  };
}

test("builds stable markdown filenames with zero-padded source row", () => {
  assert.equal(
    markdownFileFor(12, "Throwing food at meals"),
    "markdown/012-throwing-food-at-meals.md",
  );
});

test("renders story-only markdown without reference books or QA metadata", () => {
  const record = buildRecordForMarkdown({
    sourceRow: 12,
    categoryId: "template_12_throwing_food",
    behaviorIssue: "Throwing food at meals",
    referenceBooks,
    storyConcepts: [concept("The Pea Parade")],
    generationStatus: buildGenerationStatus({
      approvedCount: 1,
      batchesTried: 2,
    }),
  });

  const markdown = renderIssueMarkdown(record);

  assert.match(markdown, /^# Throwing food at meals/);
  assert.match(markdown, /## 1\. The Pea Parade/);
  assert.match(markdown, /\*\*Core theme:\*\*/);
  assert.match(markdown, /\*\*Ending message:\*\*/);
  assert.doesNotMatch(markdown, /Reference Book/);
  assert.doesNotMatch(markdown, /Expert-aligned parent action/);
  assert.doesNotMatch(markdown, /score/);
});

test("writes combined JSON and one markdown file per issue", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "kahani-library-"));
  const record = buildRecordForMarkdown({
    sourceRow: 1,
    categoryId: "template_1_full_body_tantrum_when_told_no",
    behaviorIssue: "Full-body tantrum when told no",
    referenceBooks,
    storyConcepts: [concept("The Thunder Inside {child_name}")],
    generationStatus: buildGenerationStatus({
      approvedCount: 1,
      batchesTried: 5,
    }),
  });

  const { library, jsonPath } = await writeBehaviorStoryLibraryArtifacts({
    outputDir: tempRoot,
    records: [record],
    generatedAt: "2026-05-25T00:00:00.000Z",
  });

  assert.equal(library.summary.issueCount, 1);
  assert.equal(library.records[0]?.markdownFile, record.markdownFile);
  const json = JSON.parse(await readFile(jsonPath, "utf8"));
  assert.equal(json.records[0].referenceBooks.length, 5);
  assert.equal(json.records[0].markdownFile, "markdown/001-full-body-tantrum-when-told-no.md");
  const markdown = await readFile(path.join(tempRoot, record.markdownFile), "utf8");
  assert.match(markdown, /The Thunder Inside/);
  assert.doesNotMatch(markdown, /Reference Book/);
});

test("partial approved concepts write only available stories", () => {
  const record = buildRecordForMarkdown({
    sourceRow: 2,
    categoryId: "template_2_screaming_in_public",
    behaviorIssue: "Screaming in public",
    referenceBooks,
    storyConcepts: [concept("Tiny Voice")],
    generationStatus: buildGenerationStatus({
      approvedCount: 1,
      batchesTried: 5,
    }),
  });

  const markdown = renderIssueMarkdown(record);

  assert.match(markdown, /## 1\. Tiny Voice/);
  assert.doesNotMatch(markdown, /## 2\./);
});

test("rejects markdown paths outside the markdown directory", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "kahani-library-"));
  const record = {
    ...buildRecordForMarkdown({
      sourceRow: 3,
      categoryId: "template_3",
      behaviorIssue: "Crying because a parent leaves",
      referenceBooks,
      storyConcepts: [concept("The Goodbye String")],
      generationStatus: buildGenerationStatus({
        approvedCount: 1,
        batchesTried: 1,
      }),
    }),
    markdownFile: "markdown/../bad.md",
  };

  await assert.rejects(
    writeBehaviorStoryLibraryArtifacts({
      outputDir: tempRoot,
      records: [record],
    }),
    /escapes output directory|must point inside markdown/,
  );
});
