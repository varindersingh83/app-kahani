import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLocalPhotoDescriptor,
  validatePhotoTraits,
} from "./photoTraitPolicy";

test("validatePhotoTraits accepts approved coarse traits", () => {
  assert.deepEqual(
    validatePhotoTraits({
      hairColor: "black",
      skinToneRange: "medium",
      clothingColors: ["red", "blue"],
      glasses: true,
      ageBand: "child",
    }),
    {
      ok: true,
      traits: {
        hairColor: "black",
        skinToneRange: "medium",
        clothingColors: ["red", "blue"],
        glasses: true,
        ageBand: "child",
      },
    },
  );
});

test("validatePhotoTraits rejects the whole descriptor for disallowed categories", () => {
  assert.deepEqual(
    validatePhotoTraits({
      hairColor: "black",
      ethnicity: "not allowed",
    }),
    {
      ok: false,
      reason: "disallowed_category",
      category: "ethnicity",
    },
  );
});

test("validatePhotoTraits rejects invalid approved values", () => {
  assert.deepEqual(validatePhotoTraits({ ageBand: "exactly 7" }), {
    ok: false,
    reason: "invalid_value",
    category: "ageBand",
  });
});

test("buildLocalPhotoDescriptor never includes raw photos or identity", () => {
  assert.equal(
    buildLocalPhotoDescriptor({
      hairColor: "brown",
      clothingColors: ["green"],
      glasses: false,
    }),
    "Use only these locally extracted coarse visual traits: brown hair, green clothing.",
  );
});
