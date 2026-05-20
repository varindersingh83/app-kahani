import assert from "node:assert/strict";
import test from "node:test";
import { getPhotoExtractionAvailability } from "./photoExtractionGate";

test("photo extraction defaults disabled", () => {
  assert.deepEqual(getPhotoExtractionAvailability({ platform: "ios" }), {
    available: false,
    reason: "disabled",
  });
});

test("photo extraction fails closed until a model is approved", () => {
  assert.deepEqual(
    getPhotoExtractionAvailability({ enabled: true, platform: "ios" }),
    {
      available: false,
      reason: "model_not_approved",
    },
  );
});

test("approved local model enables extraction on supported platforms", () => {
  assert.deepEqual(
    getPhotoExtractionAvailability({
      enabled: true,
      modelApproved: true,
      platform: "ios",
      modelVersion: "local-ios-v1",
    }),
    {
      available: true,
      mode: "approved-model",
      modelVersion: "local-ios-v1",
    },
  );
});

test("dev mock cannot be enabled in production", () => {
  assert.deepEqual(
    getPhotoExtractionAvailability({
      enabled: true,
      devMockEnabled: true,
      nodeEnv: "production",
      platform: "ios",
    }),
    {
      available: false,
      reason: "production_dev_mock_blocked",
    },
  );
});
