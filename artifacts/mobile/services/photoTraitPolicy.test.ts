import assert from "node:assert/strict";
import test from "node:test";
import { buildSafePhotoTraitDescriptor } from "./photoTraitPolicy";

test("buildSafePhotoTraitDescriptor accepts coarse visible traits", () => {
  assert.deepEqual(
    buildSafePhotoTraitDescriptor({
      hairColor: "brown",
      clothingColors: ["blue", "green"],
      glasses: true,
      presentation: "child",
      confidence: 0.9,
    }),
    {
      ok: true,
      descriptor:
        "Appearance descriptor: brown hair, blue and green clothing, glasses, child character.",
    },
  );
});

test("buildSafePhotoTraitDescriptor rejects disallowed sensitive fields", () => {
  assert.deepEqual(
    buildSafePhotoTraitDescriptor({
      hairColor: "brown",
      ethnicity: "Asian",
      confidence: 0.95,
    }),
    { ok: false, reason: "disallowed_field" },
  );
});

test("buildSafePhotoTraitDescriptor rejects disallowed values and low confidence", () => {
  assert.deepEqual(
    buildSafePhotoTraitDescriptor({
      hairColor: "skin tone label",
      confidence: 0.95,
    }),
    { ok: false, reason: "disallowed_value" },
  );
  assert.deepEqual(
    buildSafePhotoTraitDescriptor({
      hairColor: "brown",
      confidence: 0.4,
    }),
    { ok: false, reason: "low_confidence" },
  );
});
