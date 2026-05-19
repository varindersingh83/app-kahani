import type { GenerateStoryRequest } from "@workspace/api-zod";

export type InputGuardrailCategory =
  | "prompt_injection"
  | "high_risk_safety";

export type InputGuardrailResult =
  | { allowed: true }
  | {
      allowed: false;
      category: InputGuardrailCategory;
      reasons: string[];
    };

const PROMPT_INJECTION_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern:
      /\b(ignore|disregard|forget|override)\b.{0,80}\b(previous|prior|above|system|developer|instruction|rules?)\b/i,
    reason: "Attempts to override the story-generation rules.",
  },
  {
    pattern:
      /\b(system|developer|hidden|secret)\b.{0,80}\b(prompt|instruction|message|rules?)\b/i,
    reason: "Requests hidden prompts or internal instructions.",
  },
  {
    pattern: /\b(reveal|show|print|dump|exfiltrate)\b.{0,80}\b(prompt|instructions?|policy|secrets?)\b/i,
    reason: "Requests hidden prompts, policies, or secrets.",
  },
  {
    pattern: /\b(jailbreak|prompt injection|developer mode|dan mode)\b/i,
    reason: "Contains prompt-injection language.",
  },
];

const HIGH_RISK_SAFETY_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /\b(self[-\s]?harm|suicid(?:e|al)|kill (?:myself|himself|herself|themselves)|hurt (?:myself|himself|herself|themselves))\b/i,
    reason: "References self-harm or suicide risk.",
  },
  {
    pattern: /\b(abuse|abused|molest(?:ed|ation)?|sexual assault|domestic violence)\b/i,
    reason: "References abuse or violence requiring real-world support.",
  },
  {
    pattern: /\b(eating disorder|anorexia|bulimia|purging)\b/i,
    reason: "References serious medical or mental-health risk.",
  },
  {
    pattern: /\b(urgent|emergency|tonight|right now)\b.{0,80}\b(harm|unsafe|danger|violence|abuse|crisis)\b/i,
    reason: "References urgent safety risk.",
  },
];

export function evaluateInputGuardrails(
  request: Pick<GenerateStoryRequest, "mode" | "prompt" | "character">,
): InputGuardrailResult {
  const input = [
    request.mode,
    request.prompt,
    request.character?.name,
    request.character?.appearance,
  ]
    .filter(Boolean)
    .join("\n");

  const injectionReasons = matchingReasons(input, PROMPT_INJECTION_PATTERNS);
  if (injectionReasons.length > 0) {
    return {
      allowed: false,
      category: "prompt_injection",
      reasons: injectionReasons,
    };
  }

  const safetyReasons = matchingReasons(input, HIGH_RISK_SAFETY_PATTERNS);
  if (safetyReasons.length > 0) {
    return {
      allowed: false,
      category: "high_risk_safety",
      reasons: safetyReasons,
    };
  }

  return { allowed: true };
}

export function inputGuardrailMessage(result: InputGuardrailResult) {
  if (result.allowed) return undefined;

  if (result.category === "prompt_injection") {
    return "Please rewrite the request as a normal parenting/story concern without instructions for the AI system.";
  }

  return "This sounds urgent or serious enough that Kahani should not turn it into a story. Please seek real-world support from a trusted professional or emergency resource.";
}

function matchingReasons(
  input: string,
  checks: Array<{ pattern: RegExp; reason: string }>,
) {
  return checks
    .filter((check) => check.pattern.test(input))
    .map((check) => check.reason);
}
