import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGenerationStatus,
  buildLibrary,
  slugifyBehavior,
  validateLibraryRecord,
  type BehaviorStoryLibraryRecord,
  type StoryConcept,
} from "./types";

const passingQa = {
  pass: true,
  score: 9,
  rating: "good" as const,
  reasons: [],
  requiredFixes: [],
  safetyFlags: [],
};

function concept(title: string): StoryConcept {
  return {
    title,
    coreTheme: "Transitions, frustration tolerance",
    story: "{child_name} wanted one more slide.\n\n{parent_name} stayed close.",
    endingMessage: "Transitions feel safer with warning and connection.",
    placeholders: ["{child_name}", "{parent_name}"],
    qa: passingQa,
  };
}

function record(concepts: StoryConcept[]): BehaviorStoryLibraryRecord {
  return {
    sourceRow: 2,
    categoryId: "template_2_screaming_in_public",
    behaviorIssue: "Screaming in public",
    slug: "002-screaming-in-public",
    markdownFile: "markdown/002-screaming-in-public.md",
    referenceBooks: Array.from({ length: 5 }, (_, index) => ({
      title: `Real Book ${index + 1}`,
      author: `Author ${index + 1}`,
      source: "open_library",
      sourceId: `OL${index + 1}W`,
      firstPublishYear: 2010 + index,
    })),
    storyConcepts: concepts,
    generationStatus: buildGenerationStatus({
      approvedCount: concepts.length,
      batchesTried: 1,
    }),
  };
}

test("validates a complete behavior story library record", () => {
  const errors = validateLibraryRecord(
    record([concept("Story A"), concept("Story B"), concept("Story C")]),
  );

  assert.deepEqual(errors, []);
});

test("builds partial generation status when fewer than three concepts pass", () => {
  const status = buildGenerationStatus({ approvedCount: 1, batchesTried: 5 });

  assert.equal(status.status, "manual_review_needed");
  assert.equal(status.approvedCount, 1);
  assert.equal(status.missingCount, 2);
  assert.equal(status.manualReviewNeeded, true);
});

test("requires reusable child and parent placeholders", () => {
  const bad = record([
    {
      ...concept("Story A"),
      placeholders: ["{child_name}"],
    },
  ]);

  assert.deepEqual(validateLibraryRecord(bad), [
    "storyConcepts[0] must include {parent_name}.",
  ]);
});

test("rejects records without behavior identity or markdown file", () => {
  const bad = {
    ...record([concept("Story A")]),
    categoryId: "",
    behaviorIssue: "",
    markdownFile: "../bad.md",
  };

  assert.deepEqual(validateLibraryRecord(bad), [
    "categoryId is required.",
    "behaviorIssue is required.",
    "markdownFile must point inside markdown/.",
  ]);
});

test("summarizes complete and partial library records", () => {
  const library = buildLibrary([
    record([concept("A"), concept("B"), concept("C")]),
    record([concept("Only one")]),
  ]);

  assert.equal(library.summary.issueCount, 2);
  assert.equal(library.summary.completeCount, 1);
  assert.equal(library.summary.manualReviewNeededCount, 1);
  assert.equal(library.summary.approvedConceptCount, 4);
  assert.equal(library.summary.missingConceptCount, 2);
});

test("slugifies source row and behavior labels", () => {
  assert.equal(
    slugifyBehavior(4, "Refusing to get dressed"),
    "004-refusing-to-get-dressed",
  );
});
