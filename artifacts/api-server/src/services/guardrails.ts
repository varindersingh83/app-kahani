import type { GenerateStoryRequest } from "@workspace/api-zod";
import {
  scanPromptInjection,
  type PromptInjectionScanResult,
} from "@workspace/guardrails";

export const GUARDRAIL_REWRITE_MESSAGE =
  "Please describe the story or behavior you want help with. Requests that try to change the app's instructions cannot be used for story generation.";

export type StoryRequestGuardrailResult = {
  result: PromptInjectionScanResult;
  scannedTextLength: number;
};

export function scanStoryRequest(
  request: GenerateStoryRequest,
): StoryRequestGuardrailResult {
  const parts = [
    request.prompt,
    request.character.name,
    request.character.appearance,
    ...(request.supportingCharacters ?? []).flatMap((character) => [
      character.name,
      character.relationship,
    ]),
  ].filter((value): value is string => Boolean(value?.trim()));
  const scannedText = parts.join("\n");

  return {
    result: scanPromptInjection(scannedText),
    scannedTextLength: scannedText.length,
  };
}

export function sanitizedGuardrailLog(input: StoryRequestGuardrailResult) {
  return {
    verdict: input.result.verdict,
    score: input.result.score,
    categories: input.result.categories,
    patternIds: input.result.matches.map((match) => match.patternId),
    promptLength: input.scannedTextLength,
    normalizedTextLength: input.result.normalizedTextLength,
  };
}
