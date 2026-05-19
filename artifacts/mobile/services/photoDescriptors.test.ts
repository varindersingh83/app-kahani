import assert from "node:assert/strict";
import test from "node:test";
import { buildCharacterDescriptor } from "./photoDescriptors";

test("buildCharacterDescriptor uses manual notes without photo-source instructions", () => {
  assert.equal(
    buildCharacterDescriptor({
      presentation: "from-photo",
      notes: "curly black hair, red sweater",
    }),
    "Use only the parent-entered appearance description; do not infer gender from the child's name. curly black hair, red sweater.",
  );
});

test("buildCharacterDescriptor supports explicit parent-entered presentation", () => {
  assert.equal(
    buildCharacterDescriptor({ presentation: "girl" }),
    "The main child is a girl.",
  );
});
