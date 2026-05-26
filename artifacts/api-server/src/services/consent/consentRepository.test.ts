import assert from "node:assert/strict";
import test from "node:test";
import { createInMemoryConsentRepository } from "./consentRepository";

test("consent repository stores latest consent by user and type", async () => {
  const repository = createInMemoryConsentRepository();

  await repository.save({
    userId: "user_1",
    consentType: "onboarding",
    version: "v1",
    consentedAt: "2026-05-19T00:00:00.000Z",
    metadata: {},
  });
  await repository.save({
    userId: "user_1",
    consentType: "onboarding",
    version: "v2",
    consentedAt: "2026-05-20T00:00:00.000Z",
    metadata: {},
  });

  assert.equal(
    (await repository.latest("user_1", "onboarding"))?.version,
    "v2",
  );
});
