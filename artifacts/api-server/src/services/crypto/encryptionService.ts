import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedEnvelope = {
  version: 1;
  algorithm: "aes-256-gcm";
  keyId: string;
  iv: string;
  tag: string;
  ciphertext: string;
};

export type EncryptionService = {
  encrypt(plaintext: string): EncryptedEnvelope;
  decrypt(envelope: EncryptedEnvelope): string;
};

export function createEncryptionService(input: {
  keyBase64?: string;
  keyId?: string;
  nodeEnv?: string;
}): EncryptionService {
  const nodeEnv = input.nodeEnv ?? process.env.NODE_ENV;
  const keyBase64 = input.keyBase64 ?? process.env.KAHANI_ENCRYPTION_KEY_BASE64;
  if (!keyBase64) {
    if (nodeEnv === "production") {
      throw new Error("KAHANI_ENCRYPTION_KEY_BASE64 is required in production.");
    }
    return createAesGcmService({
      key: Buffer.alloc(32, 0),
      keyId: "local-dev-zero-key",
    });
  }

  const key = Buffer.from(keyBase64, "base64");
  if (key.length !== 32) {
    throw new Error("KAHANI_ENCRYPTION_KEY_BASE64 must decode to 32 bytes.");
  }

  return createAesGcmService({
    key,
    keyId: input.keyId ?? process.env.KAHANI_ENCRYPTION_KEY_ID ?? "primary",
  });
}

function createAesGcmService(input: {
  key: Buffer;
  keyId: string;
}): EncryptionService {
  return {
    encrypt(plaintext) {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", input.key, iv);
      const ciphertext = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
      ]);
      const tag = cipher.getAuthTag();

      return {
        version: 1,
        algorithm: "aes-256-gcm",
        keyId: input.keyId,
        iv: iv.toString("base64"),
        tag: tag.toString("base64"),
        ciphertext: ciphertext.toString("base64"),
      };
    },
    decrypt(envelope) {
      const decipher = createDecipheriv(
        "aes-256-gcm",
        input.key,
        Buffer.from(envelope.iv, "base64"),
      );
      decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(envelope.ciphertext, "base64")),
        decipher.final(),
      ]);
      return plaintext.toString("utf8");
    },
  };
}
