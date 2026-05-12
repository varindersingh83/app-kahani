import type { GenerateStoryRequest } from "@workspace/api-zod";
import type { StorySheetPlannedIssue } from "./types";

const MAX_ISSUES_PER_REQUEST = 3;

export function planStoryIssues(
  request: Pick<GenerateStoryRequest, "mode" | "prompt">,
): StorySheetPlannedIssue[] {
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

export function buildMultiIssueNotice(issues: StorySheetPlannedIssue[]) {
  if (issues.length <= 1) return undefined;
  const firstIssue = issues[0]?.issue;
  if (!firstIssue) return undefined;

  return `We can generate one book for one issue at a time. Generating this book for: ${firstIssue}.`;
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
