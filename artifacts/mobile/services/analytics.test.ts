import assert from "node:assert/strict";
import test from "node:test";
import {
  ANALYTICS_SCHEMA_VERSION,
  buildAnalyticsEnvelope,
  createAnonymousInstallId,
} from "./analytics";

test("buildAnalyticsEnvelope accepts only metadata behavior fields", () => {
  const event = buildAnalyticsEnvelope({
    event: "generation_completed",
    anonymousInstallId: "anon_install",
    now: new Date("2026-05-19T00:00:00.000Z"),
    metadata: {
      flow: "story_generation",
      platform: "ios",
      appVersion: "1.0.0",
      durationBucket: "3_10s",
      generationAfterExtraction: false,
    },
  });

  assert.deepEqual(event, {
    event: "generation_completed",
    anonymousInstallId: "anon_install",
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    createdAt: "2026-05-19T00:00:00.000Z",
    metadata: {
      flow: "story_generation",
      platform: "ios",
      appVersion: "1.0.0",
      durationBucket: "3_10s",
      generationAfterExtraction: false,
    },
  });
});

test("buildAnalyticsEnvelope rejects non-allowlisted events", () => {
  assert.throws(
    () =>
      buildAnalyticsEnvelope({
        event: "story_prompt_submitted",
        anonymousInstallId: "anon_install",
      }),
    /not allowlisted/,
  );
});

test("buildAnalyticsEnvelope rejects content and identity metadata", () => {
  for (const key of [
    "name",
    "prompt",
    "photoUri",
    "descriptor",
    "traitText",
    "generatedImageUrl",
    "characterId",
    "childId",
    "userId",
  ]) {
    assert.throws(
      () =>
        buildAnalyticsEnvelope({
          event: "generation_started",
          anonymousInstallId: "anon_install",
          metadata: { [key]: "sensitive" },
        }),
      /not allowlisted/,
      key,
    );
  }
});

test("createAnonymousInstallId never returns a bare account-like identifier", () => {
  assert.match(createAnonymousInstallId(), /^anon_/);
});
