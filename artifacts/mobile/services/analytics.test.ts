import assert from "node:assert/strict";
import test from "node:test";
import {
  createAnalyticsEvent,
  createAnonymousInstallId,
  sanitizeAnalyticsPayload,
} from "./analytics";

test("createAnalyticsEvent allows only metadata fields", () => {
  assert.deepEqual(
    createAnalyticsEvent("photo_check_failed", {
      failureCategory: "photo_too_small",
      platform: "ios",
      retryCount: 1,
    }),
    {
      name: "photo_check_failed",
      payload: {
        failureCategory: "photo_too_small",
        platform: "ios",
        retryCount: 1,
      },
    },
  );
});

test("sanitizeAnalyticsPayload rejects names, prompts, photos, descriptors, and generated content fields", () => {
  assert.throws(
    () => sanitizeAnalyticsPayload({ childName: "Maya" }),
    /not allowed/,
  );
  assert.throws(
    () => sanitizeAnalyticsPayload({ photoUri: "data:image/png;base64,abc" }),
    /not allowed/,
  );
  assert.throws(
    () => sanitizeAnalyticsPayload({ promptText: "sharing toys" }),
    /not allowed/,
  );
  assert.throws(
    () => sanitizeAnalyticsPayload({ generatedImageUrl: "https://example.com/a.png" }),
    /not allowed/,
  );
});

test("sanitizeAnalyticsPayload rejects content-like values even on allowed keys", () => {
  assert.throws(
    () => sanitizeAnalyticsPayload({ source: "file:///tmp/family.png" }),
    /not allowed/,
  );
});

test("createAnonymousInstallId does not embed user or child identifiers", () => {
  assert.match(createAnonymousInstallId("abc-123"), /^kahani-install-/);
});
