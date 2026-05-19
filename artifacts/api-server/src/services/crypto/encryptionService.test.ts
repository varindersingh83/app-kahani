import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import { createEncryptionService } from "./encryptionService";

test("encryption service round-trips without storing plaintext", () => {
  const service = createEncryptionService({
    keyBase64: randomBytes(32).toString("base64"),
    keyId: "test-key",
  });

  const encrypted = service.encrypt("family secret");

  assert.equal(encrypted.keyId, "test-key");
  assert.notEqual(encrypted.ciphertext, "family secret");
  assert.equal(service.decrypt(encrypted), "family secret");
});

test("encryption service fails closed in production without key config", () => {
  assert.throws(
    () => createEncryptionService({ nodeEnv: "production" }),
    /KAHANI_ENCRYPTION_KEY_BASE64 is required/,
  );
});

test("encryption service rejects keys with the wrong size", () => {
  assert.throws(
    () => createEncryptionService({ keyBase64: Buffer.alloc(16).toString("base64") }),
    /32 bytes/,
  );
});
