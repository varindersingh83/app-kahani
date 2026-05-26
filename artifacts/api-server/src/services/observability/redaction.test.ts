import assert from "node:assert/strict";
import test from "node:test";
import { redactSensitiveFields } from "./redaction";

test("redactSensitiveFields removes nested prompt, photo, descriptor, and image fields", () => {
  assert.deepEqual(
    redactSensitiveFields({
      request: {
        prompt: "sharing toys",
        metadata: { durationMs: 100 },
        children: [{ name: "Maya", photoUri: "file:///photo.png" }],
      },
      providerPayload: { imageUrl: "https://example.test/image.png" },
    }),
    {
      request: {
        prompt: "[REDACTED]",
        metadata: { durationMs: 100 },
        children: [{ name: "[REDACTED]", photoUri: "[REDACTED]" }],
      },
      providerPayload: "[REDACTED]",
    },
  );
});
