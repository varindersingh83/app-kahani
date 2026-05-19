import assert from "node:assert/strict";
import test from "node:test";
import { extractPhotoTraits } from "./photoTraitExtractor";
import type { PhotoExtractionGate } from "./photoExtractionGate";

const enabledGate: PhotoExtractionGate = {
  enabled: true,
  modelVersion: "candidate-1",
  devOnly: true,
};

test("extractPhotoTraits falls back when the gate is disabled", async () => {
  assert.deepEqual(
    await extractPhotoTraits({
      photoUri: "file:///photo.png",
      gate: { enabled: false, reason: "disabled", devOnly: false },
    }),
    { status: "fallback", reason: "disabled" },
  );
});

test("extractPhotoTraits returns a local descriptor for approved coarse traits", async () => {
  assert.deepEqual(
    await extractPhotoTraits({
      photoUri: "file:///photo.png",
      gate: enabledGate,
      adapter: {
        async extract() {
          return {
            hairColor: "brown",
            clothingColors: ["yellow"],
            glasses: true,
          };
        },
      },
    }),
    {
      status: "succeeded",
      modelVersion: "candidate-1",
      traits: {
        hairColor: "brown",
        clothingColors: ["yellow"],
        glasses: true,
      },
      descriptor:
        "Use only these locally extracted coarse visual traits: brown hair, yellow clothing, glasses.",
    },
  );
});

test("extractPhotoTraits falls back when model output has disallowed traits", async () => {
  assert.deepEqual(
    await extractPhotoTraits({
      photoUri: "file:///photo.png",
      gate: enabledGate,
      adapter: {
        async extract() {
          return { hairColor: "brown", emotion: "sad" };
        },
      },
    }),
    { status: "fallback", reason: "policy_rejected" },
  );
});

test("extractPhotoTraits falls back on timeout", async () => {
  assert.deepEqual(
    await extractPhotoTraits({
      photoUri: "file:///photo.png",
      gate: enabledGate,
      timeoutMs: 1,
      adapter: {
        async extract() {
          await new Promise((resolve) => setTimeout(resolve, 20));
          return { hairColor: "brown" };
        },
      },
    }),
    { status: "fallback", reason: "timeout" },
  );
});
