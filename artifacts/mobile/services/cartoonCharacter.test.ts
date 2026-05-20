import assert from "node:assert/strict";
import test from "node:test";

import { createCartoonCharacterReplacement } from "./cartoonCharacter";

test("createCartoonCharacterReplacement returns a generated cartoon data URI", () => {
  const replacement = createCartoonCharacterReplacement({
    descriptor:
      "Appearance descriptor: brown hair, blue clothing, child character.",
    relationship: "child",
  });

  assert.equal(replacement.ok, true);
  if (!replacement.ok) return;
  assert.equal(replacement.imageSource, "generated-cartoon");
  assert.match(replacement.imageUri, /^data:image\/svg\+xml;charset=utf-8,/);
  assert.doesNotMatch(
    decodeURIComponent(replacement.imageUri),
    /Appearance descriptor|child character/,
  );
});

test("createCartoonCharacterReplacement can make a generic fallback cartoon", () => {
  const replacement = createCartoonCharacterReplacement({});

  assert.equal(replacement.ok, true);
});

test("createCartoonCharacterReplacement rejects raw photo-like descriptor input", () => {
  assert.deepEqual(
    createCartoonCharacterReplacement({
      descriptor: "photoUri: file:///tmp/child.jpg",
    }),
    { ok: false, reason: "unsafe_descriptor" },
  );
});
