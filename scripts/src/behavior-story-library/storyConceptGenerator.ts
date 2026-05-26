import {
  buildStoryConceptGeneratorPrompt,
  buildStoryConceptJudgePrompt,
  normalizeJudgeReview,
  normalizeStoryConceptCandidates,
  type StoryConceptCandidate,
} from "./prompts";
import {
  TARGET_STORY_CONCEPTS,
  buildGenerationStatus,
  type ApiUsage,
  type BehaviorTemplate,
  type ReferenceBook,
  type StoryConcept,
} from "./types";

export type JsonChatClient = (
  systemPrompt: string,
  userPrompt: string,
) => Promise<{ data: unknown; usage?: ApiUsage }>;

export type GenerateApprovedConceptsResult = {
  concepts: StoryConcept[];
  status: ReturnType<typeof buildGenerationStatus>;
  attempts: Array<{
    batch: number;
    candidates: Array<{
      title?: string;
      pass: boolean;
      score: number;
      reasons: string[];
    }>;
  }>;
  usage: ApiUsage | null;
};

export async function generateApprovedStoryConcepts(input: {
  behavior: BehaviorTemplate;
  referenceBooks: ReferenceBook[];
  jsonClient: JsonChatClient;
  targetCount?: number;
  batchSize?: number;
  maxBatches?: number;
  passThreshold?: number;
}): Promise<GenerateApprovedConceptsResult> {
  const targetCount = input.targetCount ?? TARGET_STORY_CONCEPTS;
  const batchSize = input.batchSize ?? 3;
  const maxBatches = input.maxBatches ?? 5;
  const passThreshold = input.passThreshold ?? 8.5;
  const approved: StoryConcept[] = [];
  const attempts: GenerateApprovedConceptsResult["attempts"] = [];
  const previousFailures: string[] = [];
  const usages: ApiUsage[] = [];
  const seenTitles = new Set<string>();

  for (let batch = 1; batch <= maxBatches && approved.length < targetCount; batch += 1) {
    const generatorResult = await input.jsonClient(
      "You generate JSON story concepts only. Return valid JSON with no markdown or explanation.",
      buildStoryConceptGeneratorPrompt({
        behavior: input.behavior,
        referenceBooks: input.referenceBooks,
        count: batchSize,
        previousFailures,
      }),
    );
    if (generatorResult.usage) usages.push(generatorResult.usage);

    const candidates = normalizeStoryConceptCandidates(generatorResult.data);
    const batchAttempt: GenerateApprovedConceptsResult["attempts"][number] = {
      batch,
      candidates: [],
    };

    for (const candidate of candidates) {
      if (approved.length >= targetCount) break;
      const duplicateTitle = seenTitles.has(candidate.title.toLowerCase());
      if (duplicateTitle) {
        const reason = `Duplicate approved title: ${candidate.title}`;
        previousFailures.push(reason);
        batchAttempt.candidates.push({
          title: candidate.title,
          pass: false,
          score: 0,
          reasons: [reason],
        });
        continue;
      }

      const judgeResult = await input.jsonClient(
        "You are a strict story QA judge. Return valid JSON only.",
        buildStoryConceptJudgePrompt({
          behavior: input.behavior,
          referenceBooks: input.referenceBooks,
          concept: candidate,
        }),
      );
      if (judgeResult.usage) usages.push(judgeResult.usage);
      const review = normalizeJudgeReview(judgeResult.data);
      const accepted = review.pass && review.score >= passThreshold;
      batchAttempt.candidates.push({
        title: candidate.title,
        pass: accepted,
        score: review.score,
        reasons: review.reasons,
      });

      if (accepted) {
        seenTitles.add(candidate.title.toLowerCase());
        approved.push({
          ...candidate,
          qa: {
            ...review,
            pass: true,
            rating: "good",
          },
        });
      } else {
        previousFailures.push(...failureSummary(candidate, review));
      }
    }

    if (candidates.length === 0) {
      previousFailures.push(`Batch ${batch} returned no valid story concepts.`);
      batchAttempt.candidates.push({
        pass: false,
        score: 0,
        reasons: ["No valid story concepts returned."],
      });
    }

    attempts.push(batchAttempt);
  }

  const warnings =
    approved.length < targetCount
      ? [`Only ${approved.length} of ${targetCount} story concepts passed QA.`]
      : [];

  return {
    concepts: approved,
    status: buildGenerationStatus({
      approvedCount: approved.length,
      batchesTried: attempts.length,
      warnings,
    }),
    attempts,
    usage: sumUsage(usages),
  };
}

function failureSummary(
  candidate: StoryConceptCandidate,
  review: ReturnType<typeof normalizeJudgeReview>,
) {
  const reasons = review.reasons.length
    ? review.reasons
    : ["Story concept did not pass QA."];
  const fixes = review.requiredFixes.map((fix) => `Fix: ${fix}`);
  return [
    `${candidate.title}: score ${review.score}/10`,
    ...reasons,
    ...fixes,
  ];
}

function sumUsage(usages: ApiUsage[]) {
  if (usages.length === 0) return null;
  return usages.reduce<ApiUsage>((sum, usage) => {
    for (const [key, value] of Object.entries(usage)) {
      if (typeof value === "number") {
        sum[key] = (typeof sum[key] === "number" ? sum[key] : 0) + value;
      }
    }
    return sum;
  }, {});
}
