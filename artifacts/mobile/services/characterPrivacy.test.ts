import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGenericCharacterAppearance,
  getCharacterCreationPolicy,
  sanitizeCharacterForGeneration,
} from "./characterPrivacy";

test("getCharacterCreationPolicy hides photos and notes in production by default", () => {
  assert.deepEqual(getCharacterCreationPolicy({ nodeEnv: "production" }), {
    canUsePhotoPicker: false,
    canUseManualAppearanceNotes: false,
  });
});

test("getCharacterCreationPolicy keeps dev-only controls outside production", () => {
  assert.deepEqual(getCharacterCreationPolicy({ nodeEnv: "development" }), {
    canUsePhotoPicker: true,
    canUseManualAppearanceNotes: true,
  });
});

test("buildGenericCharacterAppearance uses only role and presentation", () => {
  assert.equal(
    buildGenericCharacterAppearance({ role: "child", presentation: "girl" }),
    "Use a generic child protagonist with girl presentation. Do not infer private traits from the character name.",
  );
});

test("sanitizeCharacterForGeneration strips photo data from generation payload", () => {
  const sanitized = sanitizeCharacterForGeneration({
    name: " Maya ",
    role: "child",
    presentation: "neutral",
    photoUri: "file:///family-photo.png",
  });

  assert.deepEqual(sanitized, {
    name: "Maya",
    role: "child",
    presentation: "neutral",
    appearance:
      "Use a generic child protagonist with neutral presentation. Do not infer private traits from the character name.",
  });
  assert.equal("photoUri" in sanitized, false);
});
