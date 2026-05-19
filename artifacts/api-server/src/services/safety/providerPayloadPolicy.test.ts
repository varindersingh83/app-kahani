import assert from "node:assert/strict";
import test from "node:test";
import {
  assertNoProviderReferenceImages,
  describeBlockedReferenceUri,
  sanitizeProviderReferenceImageUris,
} from "./providerPayloadPolicy";

test("sanitizeProviderReferenceImageUris removes provider-visible image references", () => {
  assert.deepEqual(
    sanitizeProviderReferenceImageUris([
      "data:image/png;base64,abc",
      "https://example.com/family.jpg",
      "file:///tmp/child.png",
      "blob:https://app.local/photo",
      "/tmp/local.png",
    ]),
    [],
  );
});

test("assertNoProviderReferenceImages fails closed when references would be attached", () => {
  assert.throws(
    () => assertNoProviderReferenceImages(["https://example.com/family.jpg"]),
    /Provider image references are disabled/,
  );
});

test("describeBlockedReferenceUri classifies raw photo reference types without leaking values", () => {
  assert.equal(describeBlockedReferenceUri("data:image/png;base64,abc"), "data");
  assert.equal(describeBlockedReferenceUri("https://example.com/family.jpg"), "http");
  assert.equal(describeBlockedReferenceUri("file:///tmp/child.png"), "file");
  assert.equal(describeBlockedReferenceUri("blob:https://app.local/photo"), "blob");
  assert.equal(describeBlockedReferenceUri("/tmp/local.png"), "other");
});
