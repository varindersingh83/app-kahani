export type PromptInjectionVerdict = "allow" | "review" | "block";
export type PromptInjectionSeverity = "low" | "medium" | "high";
export type PromptInjectionCategory =
  | "instruction_override"
  | "system_prompt_extraction"
  | "safety_bypass"
  | "data_exfiltration"
  | "tool_or_file_access"
  | "role_reassignment"
  | "output_format_attack"
  | "encoded_or_obfuscated_instruction"
  | "persistent_memory_attack";

type Rule = {
  id: string;
  category: PromptInjectionCategory;
  severity: PromptInjectionSeverity;
  pattern: RegExp;
};

export type PromptInjectionMatch = {
  category: PromptInjectionCategory;
  patternId: string;
  severity: PromptInjectionSeverity;
};

export type PromptInjectionScanResult = {
  verdict: PromptInjectionVerdict;
  score: number;
  categories: PromptInjectionCategory[];
  matches: PromptInjectionMatch[];
  normalizedTextLength: number;
};

const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;

const CONFUSABLES: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
};

const HIGH_RISK_RULES: Rule[] = [
  {
    id: "ignore-previous-instructions",
    category: "instruction_override",
    severity: "high",
    pattern: /\b(ignore|disregard|forget|bypass|override)\b.{0,40}\b(previous|prior|above|system|developer|all)\b.{0,30}\binstructions?\b/i,
  },
  {
    id: "system-prompt-extraction",
    category: "system_prompt_extraction",
    severity: "high",
    pattern: /\b(reveal|show|print|display|dump|repeat|tell me)\b.{0,40}\b(system prompt|developer prompt|hidden prompt|instructions|policy|rules)\b/i,
  },
  {
    id: "developer-mode",
    category: "role_reassignment",
    severity: "high",
    pattern: /\b(you are now|act as|switch to|enter)\b.{0,40}\b(developer mode|admin mode|jailbreak|dan mode|god mode)\b/i,
  },
  {
    id: "safety-bypass",
    category: "safety_bypass",
    severity: "high",
    pattern: /\b(disable|bypass|ignore|turn off)\b.{0,40}\b(safety|guardrails?|policy|filters?|moderation)\b/i,
  },
  {
    id: "env-or-file-access",
    category: "tool_or_file_access",
    severity: "high",
    pattern: /\b(read|list|open|cat|print|dump|access)\b.{0,40}\b(env|environment variables?|files?|filesystem|directory|database|secrets?)\b/i,
  },
  {
    id: "data-exfiltration",
    category: "data_exfiltration",
    severity: "high",
    pattern: /\b(export|send|email|upload|leak|exfiltrate|dump)\b.{0,50}\b(user data|database|secrets?|tokens?|api keys?|private data|all data)\b/i,
  },
  {
    id: "persistent-memory-attack",
    category: "persistent_memory_attack",
    severity: "high",
    pattern: /\b(save|remember|store)\b.{0,40}\b(this instruction|these instructions|for later|from now on|always)\b/i,
  },
  {
    id: "raw-internal-output",
    category: "output_format_attack",
    severity: "high",
    pattern: /\b(respond|output|return)\b.{0,40}\b(raw|verbatim|only)\b.{0,40}\b(system instructions?|developer instructions?|hidden rules?|prompt)\b/i,
  },
];

const REVIEW_RULES: Rule[] = [
  {
    id: "instruction-language-near-model",
    category: "instruction_override",
    severity: "medium",
    pattern: /\b(model|assistant|chatgpt|llm|ai)\b.{0,50}\b(instruction|rules?|policy|prompt)\b/i,
  },
  {
    id: "generic-bypass-language",
    category: "safety_bypass",
    severity: "medium",
    pattern: /\b(jailbreak|bypass|override|system prompt|developer prompt|hidden prompt)\b/i,
  },
  {
    id: "obfuscated-instruction-keywords",
    category: "encoded_or_obfuscated_instruction",
    severity: "medium",
    pattern: /\b(ign[o0]re|byp[a@]ss|[o0]verride|reve[a@]l|pr[o0]mpt|syst[e3]m)\b/i,
  },
];

const BENIGN_PARENT_CONTEXT = [
  /\b(child|kid|son|daughter|toddler|preschooler|he|she|they)\b.{0,40}\b(ignore|ignores|ignoring|follow|instructions|rules)\b/i,
  /\b(bedtime|screen|transition|playground|school|dinner|sharing|meltdown)\b/i,
];

export function scanPromptInjection(input: string): PromptInjectionScanResult {
  const normalized = normalizeText(input);
  const decoded = decodePossibleBase64(normalized);
  const texts = decoded && decoded !== normalized ? [normalized, decoded] : [normalized];
  const matches = uniqueMatches(
    texts.flatMap((text) => [
      ...findMatches(text, HIGH_RISK_RULES),
      ...findMatches(text, REVIEW_RULES),
    ]),
  );

  const hasHigh = matches.some((match) => match.severity === "high");
  const hasMedium = matches.some((match) => match.severity === "medium");
  const hasEncodedText = Boolean(decoded && decoded !== normalized);
  const onlyBenignParentContext =
    matches.length > 0 &&
    matches.every((match) => match.severity !== "high") &&
    BENIGN_PARENT_CONTEXT.some((pattern) => pattern.test(normalized));

  const verdict: PromptInjectionVerdict = hasHigh
    ? "block"
    : hasMedium && !onlyBenignParentContext
      ? "review"
      : "allow";
  const score = calculateScore(matches, hasEncodedText);

  return {
    verdict,
    score,
    categories: [...new Set(matches.map((match) => match.category))],
    matches,
    normalizedTextLength: normalized.length,
  };
}

function normalizeText(input: string) {
  const withoutZeroWidth = input.replace(ZERO_WIDTH, "");
  const mapped = [...withoutZeroWidth]
    .map((char) => CONFUSABLES[char] ?? char)
    .join("");

  return mapped
    .normalize("NFKC")
    .toLowerCase()
    .replace(/(.)\1{3,}/g, "$1$1")
    .replace(/\s+/g, " ")
    .trim();
}

function decodePossibleBase64(text: string) {
  const compact = text.replace(/\s+/g, "");
  if (compact.length < 16 || compact.length > 2048) return null;
  if (!/^[a-z0-9+/=]+$/i.test(compact) || compact.length % 4 !== 0) return null;

  try {
    const decoded = Buffer.from(compact, "base64").toString("utf8");
    const printableRatio =
      decoded.replace(/[\x20-\x7E\n\r\t]/g, "").length / Math.max(decoded.length, 1);
    if (printableRatio > 0.05) return null;
    return normalizeText(decoded);
  } catch {
    return null;
  }
}

function findMatches(text: string, rules: Rule[]): PromptInjectionMatch[] {
  return rules
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => ({
      category: rule.category,
      patternId: rule.id,
      severity: rule.severity,
    }));
}

function uniqueMatches(matches: PromptInjectionMatch[]) {
  const seen = new Set<string>();

  return matches.filter((match) => {
    const key = `${match.category}:${match.patternId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function calculateScore(matches: PromptInjectionMatch[], hasEncodedText: boolean) {
  const base = matches.reduce((sum, match) => {
    if (match.severity === "high") return sum + 0.45;
    if (match.severity === "medium") return sum + 0.25;
    return sum + 0.1;
  }, hasEncodedText ? 0.2 : 0);

  return Math.min(0.99, Number(base.toFixed(2)));
}
