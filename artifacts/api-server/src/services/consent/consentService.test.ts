import assert from "node:assert/strict";
import test from "node:test";
import { requireExternalTextAiConsent } from "./consentService";

test("allows generation when external text AI consent is explicit", () => {
  const decision = requireExternalTextAiConsent({
    mode: "behavior",
    prompt: "Meltdowns during transitions",
    character: { name: "Maya" },
    externalTextAiConsent: true,
  });

  assert.equal(decision.allowed, true);
});

test("blocks generation when external text AI consent is missing", () => {
  const decision = requireExternalTextAiConsent({
    mode: "behavior",
    prompt: "Meltdowns during transitions",
    character: { name: "Maya" },
  });

  assert.equal(decision.allowed, false);
  assert.equal(
    decision.allowed ? undefined : decision.code,
    "external_text_ai_consent_required",
  );
});
