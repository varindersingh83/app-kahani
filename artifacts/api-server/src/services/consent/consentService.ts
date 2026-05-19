import type { GenerateStoryRequest } from "@workspace/api-zod";

export type ConsentDecision =
  | { allowed: true }
  | {
      allowed: false;
      code: "external_text_ai_consent_required";
      message: string;
    };

export type ConsentAwareGenerateStoryRequest = GenerateStoryRequest & {
  externalTextAiConsent?: boolean;
};

export function requireExternalTextAiConsent(
  request: ConsentAwareGenerateStoryRequest,
): ConsentDecision {
  if (request.externalTextAiConsent === true) {
    return { allowed: true };
  }

  return {
    allowed: false,
    code: "external_text_ai_consent_required",
    message:
      "Story generation uses an external AI text provider. Please review and consent before generating a book.",
  };
}
