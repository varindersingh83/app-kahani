import assert from "node:assert/strict";
import test from "node:test";
import {
  decidePhotoCreationFlow,
  sanitizeCharacterForStorage,
  sanitizeCharactersForStorage,
} from "./characterPrivacy";

test("sanitizeCharacterForStorage strips raw photo references", () => {
  assert.deepEqual(
    sanitizeCharacterForStorage({
      id: "1",
      name: "Maya",
      photoUri: "data:image/png;base64,abc",
      appearance: "Appearance descriptor: brown hair.",
    }),
    {
      id: "1",
      name: "Maya",
      appearance: "Appearance descriptor: brown hair.",
      appearanceSource: "manual",
    },
  );
});

test("sanitizeCharactersForStorage removes stale photos from all characters", () => {
  assert.deepEqual(
    sanitizeCharactersForStorage([
      { id: "1", name: "Maya", photoUri: "file:///tmp/maya.jpg" },
    ]),
    [{ id: "1", name: "Maya", appearanceSource: "generic" }],
  );
});

test("decidePhotoCreationFlow saves valid local descriptors without manual fallback", () => {
  assert.deepEqual(
    decidePhotoCreationFlow({
      extraction: {
        ok: true,
        descriptor: "Appearance descriptor: brown hair.",
      },
      retryCount: 0,
    }),
    {
      action: "save",
      appearance: "Appearance descriptor: brown hair.",
      appearanceSource: "local-photo",
    },
  );
});

test("decidePhotoCreationFlow retries once then falls back to manual details", () => {
  assert.equal(
    decidePhotoCreationFlow({
      extraction: { ok: false, reason: "photo_too_small" },
      retryCount: 0,
    }).action,
    "retry",
  );
  assert.equal(
    decidePhotoCreationFlow({
      extraction: { ok: false, reason: "photo_too_small" },
      retryCount: 1,
    }).action,
    "manual_fallback",
  );
});
