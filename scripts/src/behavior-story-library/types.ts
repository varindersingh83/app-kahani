export const TARGET_STORY_CONCEPTS = 3;
export const TARGET_REFERENCE_BOOKS = 5;

export type BehaviorTemplate = {
  categoryId: string;
  sourceRow: number;
  scene: string;
  visibleBehavior: string;
  mechanism: string;
  strategy: string;
  childStorySkill: string;
  parentGuidance: string;
  targetOutcome: string;
  storyFocusLabel: string;
  expertSources?: string;
  avoidDoing?: string;
  aliases?: string[];
  intensity?: number;
};

export type ReferenceBookSource = "open_library" | "google_books" | "manual";

export type ReferenceBook = {
  title: string;
  author: string;
  source: ReferenceBookSource;
  sourceId: string;
  firstPublishYear?: number;
  publisher?: string;
  isbn?: string;
};

export type ApiUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number;
  total_cost?: number;
  [key: string]: unknown;
};

export type StoryConceptQa = {
  pass: boolean;
  score: number;
  rating: "good" | "bad";
  reasons: string[];
  requiredFixes: string[];
  safetyFlags: string[];
};

export type StoryConcept = {
  title: string;
  coreTheme: string;
  story: string;
  endingMessage: string;
  placeholders: string[];
  toolsOrRituals?: string[];
  inspiredBy?: string[];
  qa: StoryConceptQa;
};

export type GenerationStatus = {
  status: "complete" | "manual_review_needed" | "failed";
  approvedCount: number;
  targetCount: number;
  missingCount: number;
  batchesTried: number;
  manualReviewNeeded: boolean;
  warnings: string[];
};

export type BehaviorStoryLibraryRecord = {
  sourceRow: number;
  categoryId: string;
  behaviorIssue: string;
  slug: string;
  markdownFile: string;
  referenceBooks: ReferenceBook[];
  storyConcepts: StoryConcept[];
  generationStatus: GenerationStatus;
};

export type BehaviorStoryLibrary = {
  generatedAt: string;
  targetConceptsPerIssue: number;
  targetReferenceBooksPerIssue: number;
  records: BehaviorStoryLibraryRecord[];
  summary: {
    issueCount: number;
    completeCount: number;
    manualReviewNeededCount: number;
    failedCount: number;
    approvedConceptCount: number;
    missingConceptCount: number;
  };
};

export type IssueAttemptLog = {
  sourceRow: number;
  categoryId: string;
  behaviorIssue: string;
  batches: Array<{
    batch: number;
    candidates: Array<{
      title?: string;
      score?: number;
      pass?: boolean;
      reasons?: string[];
    }>;
  }>;
  warnings: string[];
};

export function slugifyBehavior(sourceRow: number, label: string) {
  const slug = label
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return `${String(sourceRow).padStart(3, "0")}-${slug || "behavior-issue"}`;
}

export function buildGenerationStatus(input: {
  approvedCount: number;
  batchesTried: number;
  warnings?: string[];
  failed?: boolean;
}): GenerationStatus {
  const missingCount = Math.max(0, TARGET_STORY_CONCEPTS - input.approvedCount);
  const failed = input.failed === true;
  return {
    status: failed
      ? "failed"
      : missingCount === 0
        ? "complete"
        : "manual_review_needed",
    approvedCount: input.approvedCount,
    targetCount: TARGET_STORY_CONCEPTS,
    missingCount,
    batchesTried: input.batchesTried,
    manualReviewNeeded: !failed && missingCount > 0,
    warnings: input.warnings ?? [],
  };
}

export function validateLibraryRecord(record: BehaviorStoryLibraryRecord) {
  const errors: string[] = [];
  if (!record.categoryId) errors.push("categoryId is required.");
  if (!record.sourceRow) errors.push("sourceRow is required.");
  if (!record.behaviorIssue) errors.push("behaviorIssue is required.");
  if (!record.slug) errors.push("slug is required.");
  if (!record.markdownFile) errors.push("markdownFile is required.");
  if (!record.markdownFile.startsWith("markdown/")) {
    errors.push("markdownFile must point inside markdown/.");
  }
  for (const [index, book] of record.referenceBooks.entries()) {
    if (!book.title) errors.push(`referenceBooks[${index}].title is required.`);
    if (!book.author) errors.push(`referenceBooks[${index}].author is required.`);
    if (!book.sourceId) {
      errors.push(`referenceBooks[${index}].sourceId is required.`);
    }
  }
  for (const [index, concept] of record.storyConcepts.entries()) {
    if (!concept.title) errors.push(`storyConcepts[${index}].title is required.`);
    if (!concept.coreTheme) {
      errors.push(`storyConcepts[${index}].coreTheme is required.`);
    }
    if (!concept.story) errors.push(`storyConcepts[${index}].story is required.`);
    if (!concept.endingMessage) {
      errors.push(`storyConcepts[${index}].endingMessage is required.`);
    }
    if (!concept.placeholders.includes("{child_name}")) {
      errors.push(`storyConcepts[${index}] must include {child_name}.`);
    }
    if (!concept.placeholders.includes("{parent_name}")) {
      errors.push(`storyConcepts[${index}] must include {parent_name}.`);
    }
  }
  if (
    record.generationStatus.approvedCount !== record.storyConcepts.length
  ) {
    errors.push("approvedCount must match storyConcepts length.");
  }
  return errors;
}

export function buildLibrary(records: BehaviorStoryLibraryRecord[]): BehaviorStoryLibrary {
  return {
    generatedAt: new Date().toISOString(),
    targetConceptsPerIssue: TARGET_STORY_CONCEPTS,
    targetReferenceBooksPerIssue: TARGET_REFERENCE_BOOKS,
    records,
    summary: {
      issueCount: records.length,
      completeCount: records.filter(
        (record) => record.generationStatus.status === "complete",
      ).length,
      manualReviewNeededCount: records.filter(
        (record) => record.generationStatus.status === "manual_review_needed",
      ).length,
      failedCount: records.filter(
        (record) => record.generationStatus.status === "failed",
      ).length,
      approvedConceptCount: records.reduce(
        (sum, record) => sum + record.storyConcepts.length,
        0,
      ),
      missingConceptCount: records.reduce(
        (sum, record) => sum + record.generationStatus.missingCount,
        0,
      ),
    },
  };
}
