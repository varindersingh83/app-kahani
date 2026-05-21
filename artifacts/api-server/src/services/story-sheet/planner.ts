import type { GenerateStoryRequest } from "@workspace/api-zod";
import {
  findBehaviorMatches,
  toClassificationSummary,
} from "./behaviorTaxonomy";
import type {
  BehaviorClassificationResult,
  StorySheetPlannedIssue,
} from "./types";

const MAX_ISSUES_PER_REQUEST = 3;

export function planStoryIssues(
  request: Pick<GenerateStoryRequest, "mode" | "prompt">,
): StorySheetPlannedIssue[] {
  const classification = classifyStoryRequest(request);
  if (classification.status === "classified") {
    return [
      classification.primary,
      ...classification.secondary.slice(0, MAX_ISSUES_PER_REQUEST - 1),
    ].map((summary) => ({
      issue: summary.storyFocusLabel,
      bookIntent: buildBookIntent(summary.storyFocusLabel, request.mode),
      classification: summary,
    }));
  }

  const prompt = request.prompt?.trim();
  const fallback =
    request.mode === "random"
      ? "a warm imaginative story about a small everyday adventure"
      : "learning to share, pause, and repair after a difficult moment";

  const issues = splitIssuePrompt(prompt || fallback);
  return issues.map((issue) => ({
    issue,
    bookIntent: buildBookIntent(issue, request.mode),
  }));
}

export function classifyStoryRequest(
  request: Pick<GenerateStoryRequest, "mode" | "prompt"> & {
    clarification?: { originalPrompt?: string; answer?: string };
  },
): BehaviorClassificationResult {
  const input =
    request.clarification?.answer?.trim() ||
    [request.prompt, request.clarification?.originalPrompt]
      .filter(Boolean)
      .join(" ")
      .trim();

  if (request.mode === "random") {
    return {
      status: "classified",
      primary: {
        categoryId: "random_story",
        scene: "imaginative everyday adventure",
        visibleBehavior: "open story idea",
        mechanism: "not behavior-classified",
        strategy: "warm imaginative story arc",
        childStorySkill: "notice, wonder, and try a small next step",
        parentGuidance: "Enjoy the story together.",
        targetOutcome: "Child gets a warm, personalized story.",
        storyFocusLabel: request.prompt?.trim() || "warm imaginative adventure",
      },
      secondary: [],
      parentNote: "Enjoy the story together.",
      storyFocusLabel: request.prompt?.trim() || "warm imaginative adventure",
    };
  }

  if (!input) {
    return {
      status: "needs_clarification",
      question:
        "What is the clearest thing your child does in that moment: clings, screams, refuses to stop, runs away, hits, or something else?",
      choices: [
        "clings or needs me close",
        "screams or melts down",
        "refuses the next step",
      ],
    };
  }

  const matches = findBehaviorMatches(input);
  if (matches.length === 0) {
    const primary = buildCustomBehaviorSummary(input);
    return {
      status: "classified",
      primary,
      secondary: [],
      parentNote: primary.parentGuidance,
      storyFocusLabel: primary.storyFocusLabel,
    };
  }

  const primary = toClassificationSummary(matches[0].entry);
  const secondary = matches
    .slice(1, MAX_ISSUES_PER_REQUEST)
    .map((match) => toClassificationSummary(match.entry));

  return {
    status: "classified",
    primary,
    secondary,
    parentNote: primary.parentGuidance,
    storyFocusLabel: primary.storyFocusLabel,
  };
}

export function buildMultiIssueNotice(issues: StorySheetPlannedIssue[]) {
  if (issues.length <= 1) return undefined;
  const firstIssue = issues[0]?.issue;
  if (!firstIssue) return undefined;

  return `We can generate one book for one issue at a time. Generating this book for: ${firstIssue}.`;
}

function buildCustomBehaviorSummary(input: string) {
  return {
    categoryId: "custom_behavior",
    scene: "everyday family routine",
    visibleBehavior: input,
    mechanism: "child needs practice with a specific parent-described moment",
    strategy: "turn the parent-described behavior into one small, repeatable step",
    childStorySkill: "notice the moment, try one small step, and stay connected",
    parentGuidance:
      "Keep the story focused on the exact behavior you described and practice one small next step.",
    targetOutcome:
      "Child can practice the parent-described behavior with a simple, supportive script.",
    storyFocusLabel: input,
  };
}

function splitIssuePrompt(prompt: string) {
  const normalized = prompt
    .replace(/\s+/g, " ")
    .replace(/\s*;\s*/g, ", ")
    .trim();

  const parts = normalized
    .split(/(?:\n+|,\s+|\s+\+\s+)/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) return [normalized];

  return parts
    .filter((part) => part.length >= 4)
    .slice(0, MAX_ISSUES_PER_REQUEST);
}

function buildBookIntent(issue: string, mode: GenerateStoryRequest["mode"]) {
  if (mode === "random") {
    return `Create one warm, imaginative picture-book story centered on: ${issue}.`;
  }

  return `Create one focused behavior-support picture book that helps the child practice with: ${issue}.`;
}
