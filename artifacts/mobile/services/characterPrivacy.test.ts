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

test("sanitizeCharacterForStorage preserves generated cartoon references", () => {
  const cartoonUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    '<svg data-kahani-cartoon="v1"><circle cx="1" cy="1" r="1"/></svg>',
  )}`;

  assert.deepEqual(
    sanitizeCharacterForStorage({
      id: "1",
      name: "Maya",
      characterImageUri: cartoonUri,
      characterImageSource: "generated-cartoon",
    }),
    {
      id: "1",
      name: "Maya",
      characterImageUri: cartoonUri,
      characterImageSource: "generated-cartoon",
      appearanceSource: "generic",
    },
  );
});

test("sanitizeCharacterForStorage strips unsafe generated image references", () => {
  assert.deepEqual(
    sanitizeCharacterForStorage({
      id: "1",
      name: "Maya",
      characterImageUri: "file:///tmp/maya.jpg",
      characterImageSource: "generated-cartoon",
    }),
    {
      id: "1",
      name: "Maya",
      appearanceSource: "generic",
    },
  );
});

test("sanitizeCharacterForStorage strips unmarked svg image references", () => {
  assert.deepEqual(
    sanitizeCharacterForStorage({
      id: "1",
      name: "Maya",
      characterImageUri: "data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E",
      characterImageSource: "generated-cartoon",
    }),
    {
      id: "1",
      name: "Maya",
      appearanceSource: "generic",
    },
  );
});

test("sanitizeCharacterForStorage strips active or embedded svg content", () => {
  const unsafeCartoonUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    '<svg data-kahani-cartoon="v1" onload="alert(1)"><foreignObject><img src="data:image/png;base64,abc"/></foreignObject></svg>',
  )}`;

  assert.deepEqual(
    sanitizeCharacterForStorage({
      id: "1",
      name: "Maya",
      characterImageUri: unsafeCartoonUri,
      characterImageSource: "generated-cartoon",
    }),
    {
      id: "1",
      name: "Maya",
      appearanceSource: "generic",
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
