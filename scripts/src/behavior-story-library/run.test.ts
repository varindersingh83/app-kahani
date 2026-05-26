import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  getAiConfigFromEnv,
  runBehaviorStoryLibrary,
  selectTemplates,
  type RunnerSummary,
} from "./run";
import type { BookSearchProvider } from "./bookVerifier";
import type { BehaviorTemplate, ReferenceBook } from "./types";

function behavior(sourceRow: number, visibleBehavior: string): BehaviorTemplate {
  return {
    categoryId: `template_${sourceRow}`,
    sourceRow,
    scene: "home",
    visibleBehavior,
    mechanism: "Need for control.",
    strategy: "Offer two acceptable choices.",
    childStorySkill: "choose one acceptable next step",
    parentGuidance: "Offer two acceptable choices. Avoid yelling.",
    targetOutcome: "Child accepts one choice.",
    storyFocusLabel: visibleBehavior,
    avoidDoing: "Do not yell.",
  };
}

function refBook(title: string): ReferenceBook {
  return {
    title,
    author: "Real Author",
    source: "open_library",
    sourceId: `/works/${title.replace(/\s+/g, "")}`,
  };
}

const provider: BookSearchProvider = {
  source: "open_library",
  async search() {
    return [
      refBook("Book One"),
      refBook("Book Two"),
      refBook("Book Three"),
      refBook("Book Four"),
      refBook("Book Five"),
    ];
  },
};

test("selectTemplates supports source-row subsets and limits", () => {
  const templates = [
    behavior(1, "One"),
    behavior(2, "Two"),
    behavior(3, "Three"),
  ];

  assert.deepEqual(
    selectTemplates(templates, { sourceRows: [2, 3], limit: 1 }).map(
      (entry) => entry.sourceRow,
    ),
    [2],
  );
});

test("runs mocked behavior story library batch and writes JSON plus Markdown", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "kahani-library-run-"));
  let generationCalls = 0;
  const result = await runBehaviorStoryLibrary({
    repoRoot: process.cwd(),
    outputDir: tempRoot,
    generatedAt: "2026-05-25T01:02:03.000Z",
    behaviorTemplates: [
      behavior(1, "Full-body tantrum when told no"),
      behavior(2, "Screaming in public"),
    ],
    providers: [provider],
    jsonClient: async (_system, prompt) => {
      if (/Return exactly 3 story concepts/.test(prompt)) {
        generationCalls += 1;
        return {
          data: {
            concepts: [1, 2, 3].map((index) => ({
              title: `Story ${generationCalls}-${index}`,
              coreTheme: "Choice, regulation",
              story:
                "{child_name} wanted one more turn.\n\n{parent_name} offered two helpful choices.",
              endingMessage: "Choices help big feelings move.",
              placeholders: ["{child_name}", "{parent_name}"],
              toolsOrRituals: ["two choices"],
              inspiredBy: ["Book One"],
            })),
          },
          usage: { total_tokens: 10 },
        };
      }
      return {
        data: {
          pass: true,
          score: 9,
          reasons: ["Good parent action."],
          requiredFixes: [],
          safetyFlags: [],
        },
        usage: { total_tokens: 1 },
      };
    },
  });

  assert.equal(result.summary.issueCount, 2);
  assert.equal(result.summary.completeCount, 2);
  assert.equal(result.summary.approvedConceptCount, 6);
  assert.equal(result.summary.usage?.total_tokens, 26);

  const json = JSON.parse(
    await readFile(path.join(tempRoot, "behavior-story-library.json"), "utf8"),
  );
  assert.equal(json.records.length, 2);
  assert.equal(json.records[0].referenceBooks.length, 5);
  assert.equal(json.records[0].storyConcepts.length, 3);

  const markdown = await readFile(
    path.join(tempRoot, "markdown/001-full-body-tantrum-when-told-no.md"),
    "utf8",
  );
  assert.match(markdown, /# Full-body tantrum when told no/);
  assert.match(markdown, /## 3\. Story 1-3/);
  assert.doesNotMatch(markdown, /Book One/);

  const summary = JSON.parse(
    await readFile(
      path.join(tempRoot, "runs/2026-05-25T01-02-03-000Z/run-summary.json"),
      "utf8",
    ),
  ) as RunnerSummary;
  assert.equal(summary.completeCount, 2);
});

test("continues after a provider failure and marks issue failed", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "kahani-library-run-"));
  const result = await runBehaviorStoryLibrary({
    repoRoot: process.cwd(),
    outputDir: tempRoot,
    generatedAt: "2026-05-25T01:02:03.000Z",
    behaviorTemplates: [behavior(1, "Failure issue"), behavior(2, "Success issue")],
    providers: [
      {
        source: "open_library",
        async search() {
          throw new Error("provider down");
        },
      },
    ],
    jsonClient: async () => {
      throw new Error("should not be reached for no-book provider test");
    },
    limit: 1,
  });

  assert.equal(result.summary.issueCount, 1);
  assert.equal(result.library.records[0]?.generationStatus.status, "failed");
  assert.match(result.summary.warnings.join("\n"), /provider down|no-book/i);
});

test("fails clearly when AI credentials are missing", () => {
  assert.equal(getAiConfigFromEnv({}), null);
});
