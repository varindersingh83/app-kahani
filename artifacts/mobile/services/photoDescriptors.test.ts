import assert from "node:assert/strict";
import test from "node:test";
import { buildCharacterDescriptor } from "./photoDescriptors";

test("buildCharacterDescriptor uses manual notes without photo-source instructions", () => {
  assert.equal(
    buildCharacterDescriptor({
      presentation: "neutral",
      notes: "curly black hair, red sweater",
    }),
    "Use only the parent-entered appearance description for the main child; do not infer gender from the character's name. curly black hair, red sweater.",
  );
});

test("buildCharacterDescriptor supports explicit parent-entered presentation", () => {
  assert.equal(
    buildCharacterDescriptor({ presentation: "girl" }),
    "The main child has girl presentation.",
  );
});
