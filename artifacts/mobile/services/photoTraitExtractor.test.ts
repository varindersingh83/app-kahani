import assert from "node:assert/strict";
import test from "node:test";
import { extractPhotoTraits } from "./photoTraitExtractor";

test("extractPhotoTraits returns unavailable when gate is closed", async () => {
  assert.deepEqual(
    await extractPhotoTraits({
      asset: { uri: "file:///tmp/photo.jpg", width: 512, height: 512 },
      availability: { available: false, reason: "model_not_approved" },
    }),
    { ok: false, reason: "model_unavailable" },
  );
});

test("extractPhotoTraits rejects tiny photos before adapter output is trusted", async () => {
  assert.deepEqual(
    await extractPhotoTraits({
      asset: { uri: "file:///tmp/photo.jpg", width: 128, height: 512 },
      availability: {
        available: true,
        mode: "approved-model",
        modelVersion: "local-ios-v1",
      },
    }),
    { ok: false, reason: "photo_too_small" },
  );
});

test("extractPhotoTraits returns descriptor only after policy validation", async () => {
  assert.deepEqual(
    await extractPhotoTraits({
      asset: { uri: "file:///tmp/photo.jpg", width: 512, height: 512 },
      availability: {
        available: true,
        mode: "approved-model",
        modelVersion: "local-ios-v1",
      },
      adapter: async () => ({
        hairColor: "brown",
        clothingColors: ["blue"],
        confidence: 0.95,
      }),
    }),
    {
      ok: true,
      descriptor: "Appearance descriptor: brown hair, blue clothing.",
      modelVersion: "local-ios-v1",
    },
  );
});

test("extractPhotoTraits rejects adapter output with sensitive traits", async () => {
  assert.deepEqual(
    await extractPhotoTraits({
      asset: { uri: "file:///tmp/photo.jpg", width: 512, height: 512 },
      availability: {
        available: true,
        mode: "approved-model",
        modelVersion: "local-ios-v1",
      },
      adapter: async () =>
        ({
          hairColor: "brown",
          race: "Asian",
          confidence: 0.95,
        }) as never,
    }),
    { ok: false, reason: "policy_rejected" },
  );
});
