import type { PageCandidate, PipelineStory, PipelineStoryPage, ValidationResult } from "./types";

const MAX_PROMPT_WORDS = 140;
const MIN_ALIGNMENT_SCORE = 0.72;

export function validateStory(story: PipelineStory): ValidationResult {
  const failures: string[] = [];
  if (story.pages.length !== 12) {
    failures.push(`expected 12 pages, received ${story.pages.length}`);
  }

  const seen = new Set<number>();
  for (const page of story.pages) {
    seen.add(page.pageNumber);
    failures.push(...validatePage(page).failures.map((failure) => `page ${page.pageNumber}: ${failure}`));
  }

  for (let pageNumber = 1; pageNumber <= 12; pageNumber += 1) {
    if (!seen.has(pageNumber)) {
      failures.push(`missing page ${pageNumber}`);
    }
  }

  return { ok: failures.length === 0, failures };
}

export function validatePage(page: PipelineStoryPage): ValidationResult {
  const failures: string[] = [];
  if (!Number.isInteger(page.pageNumber) || page.pageNumber < 1) {
    failures.push("page number must be a positive integer");
  }
  if (!page.text.trim()) {
    failures.push("page text is required");
  }
  if (!page.illustrationPrompt.trim()) {
    failures.push("illustration prompt is required");
  }
  if (sentenceCount(page.text) > 3) {
    failures.push("page text must be 1-3 short sentences");
  }
  if (wordCount(page.illustrationPrompt) > MAX_PROMPT_WORDS) {
    failures.push(`illustration prompt must be ${MAX_PROMPT_WORDS} words or fewer`);
  }
  if (!/watercolor/i.test(page.illustrationPrompt)) {
    failures.push("illustration prompt must include watercolor style");
  }

  return { ok: failures.length === 0, failures };
}

export function scoreAlignment(page: PipelineStoryPage, childName: string) {
  let score = 0.45;
  if (page.text.toLowerCase().includes(childName.toLowerCase())) score += 0.2;
  if (page.illustrationPrompt.toLowerCase().includes(childName.toLowerCase())) score += 0.2;
  if (/warm|gentle|cozy|calm|happy|hopeful|soft/i.test(`${page.text} ${page.illustrationPrompt}`)) {
    score += 0.1;
  }
  if (/watercolor/i.test(page.illustrationPrompt)) score += 0.1;
  if (sentenceCount(page.text) <= 3) score += 0.05;

  return Math.min(1, Number(score.toFixed(2)));
}

export function validateAlignment(page: PipelineStoryPage, childName: string): ValidationResult & { score: number } {
  const score = scoreAlignment(page, childName);
  const failures = score >= MIN_ALIGNMENT_SCORE ? [] : [`alignment score ${score} below ${MIN_ALIGNMENT_SCORE}`];
  return { ok: failures.length === 0, failures, score };
}

export function selectBestCandidate(candidates: PageCandidate[]) {
  return candidates.reduce<PageCandidate | null>((best, candidate) => {
    if (!best || candidate.alignmentScore > best.alignmentScore) return candidate;
    return best;
  }, null);
}

function sentenceCount(text: string) {
  return text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function wordCount(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
