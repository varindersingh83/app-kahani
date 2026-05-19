import { createHash } from "node:crypto";
import type { GenerateStoryRequest } from "@workspace/api-zod";
import type { InputGuardrailResult } from "./inputGuardrails";

export type SafetyEvent = {
  eventType: "input_guardrail_blocked";
  category: Exclude<InputGuardrailResult, { allowed: true }>["category"];
  promptHash?: string;
  promptLength: number;
  mode: GenerateStoryRequest["mode"];
  reasons: string[];
};

export function buildInputGuardrailEvent(
  request: GenerateStoryRequest,
  result: Exclude<InputGuardrailResult, { allowed: true }>,
): SafetyEvent {
  const prompt = request.prompt?.trim() ?? "";
  return {
    eventType: "input_guardrail_blocked",
    category: result.category,
    promptHash: prompt ? sha256(prompt) : undefined,
    promptLength: prompt.length,
    mode: request.mode,
    reasons: result.reasons,
  };
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
