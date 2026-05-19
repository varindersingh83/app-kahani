export type OutputSafetyResult =
  | { allowed: true }
  | {
      allowed: false;
      category: "unsafe_child_content" | "prompt_injection_echo" | "provider_leak";
      message: string;
    };

const BLOCKED_PATTERNS: Array<{
  category: Exclude<OutputSafetyResult, { allowed: true }>["category"];
  pattern: RegExp;
}> = [
  { category: "prompt_injection_echo", pattern: /ignore previous instructions/i },
  { category: "provider_leak", pattern: /(system prompt|developer message|api key)/i },
  { category: "unsafe_child_content", pattern: /(self-harm|sexual|graphic violence)/i },
];

export function evaluateGeneratedOutputSafety(input: {
  title?: string;
  pages?: Array<{ text?: string; illustrationPrompt?: string }>;
}): OutputSafetyResult {
  const text = [
    input.title,
    ...(input.pages ?? []).flatMap((page) => [
      page.text,
      page.illustrationPrompt,
    ]),
  ]
    .filter(Boolean)
    .join("\n");

  for (const blocked of BLOCKED_PATTERNS) {
    if (blocked.pattern.test(text)) {
      return {
        allowed: false,
        category: blocked.category,
        message: "Generated output was blocked by the safety gate.",
      };
    }
  }

  return { allowed: true };
}
