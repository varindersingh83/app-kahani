import assert from "node:assert/strict";
import test from "node:test";
import {
  ONBOARDING_CONSENT_VERSION,
  createAcceptedConsent,
  createDeclinedConsent,
  hasRequiredOnboardingConsent,
  parseOnboardingConsent,
  serializeOnboardingConsent,
} from "./onboardingConsent";

test("accepted current consent unlocks app access", () => {
  const consent = createAcceptedConsent("2026-05-20T00:00:00.000Z");

  assert.equal(consent.version, ONBOARDING_CONSENT_VERSION);
  assert.equal(hasRequiredOnboardingConsent(consent), true);
});

test("declined or stale consent does not unlock app access", () => {
  assert.equal(
    hasRequiredOnboardingConsent(
      createDeclinedConsent("2026-05-20T00:00:00.000Z"),
    ),
    false,
  );
  assert.equal(
    hasRequiredOnboardingConsent({
      status: "accepted",
      version: "old",
      decidedAt: "2026-05-20T00:00:00.000Z",
    }),
    false,
  );
});

test("parseOnboardingConsent accepts only valid stored consent shape", () => {
  const consent = createAcceptedConsent("2026-05-20T00:00:00.000Z");

  assert.deepEqual(
    parseOnboardingConsent(serializeOnboardingConsent(consent)),
    consent,
  );
  assert.equal(parseOnboardingConsent("{"), null);
  assert.equal(parseOnboardingConsent(JSON.stringify({ status: "accepted" })), null);
});
