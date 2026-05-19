import assert from "node:assert/strict";
import test from "node:test";
import { getPhotoExtractionGate } from "./photoExtractionGate";

test("getPhotoExtractionGate is disabled in production by default", () => {
  assert.deepEqual(getPhotoExtractionGate({ nodeEnv: "production" }), {
    enabled: false,
    reason: "disabled",
    devOnly: false,
  });
});

test("getPhotoExtractionGate rejects production without an approved model", () => {
  assert.deepEqual(
    getPhotoExtractionGate({
      nodeEnv: "production",
      platform: "ios",
      enabled: true,
      modelVersion: "candidate-1",
    }),
    {
      enabled: false,
      reason: "production_model_not_approved",
      devOnly: false,
    },
  );
});

test("getPhotoExtractionGate enables only approved iOS production model", () => {
  assert.deepEqual(
    getPhotoExtractionGate({
      nodeEnv: "production",
      platform: "ios",
      enabled: true,
      modelApproved: true,
      modelVersion: "approved-1",
    }),
    {
      enabled: true,
      modelVersion: "approved-1",
      devOnly: false,
    },
  );
});

test("getPhotoExtractionGate rejects non-iOS platforms", () => {
  assert.deepEqual(
    getPhotoExtractionGate({
      nodeEnv: "development",
      platform: "android",
      enabled: true,
      modelVersion: "candidate-1",
    }),
    {
      enabled: false,
      reason: "unsupported_platform",
      devOnly: true,
    },
  );
});
