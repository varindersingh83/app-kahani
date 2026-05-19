import assert from "node:assert/strict";
import test from "node:test";
import {
  ONBOARDING_CONSENT_STORAGE_KEY,
  acceptOnboardingConsent,
  declineOnboardingConsent,
  getOnboardingConsent,
  type ConsentStorage,
} from "./onboardingConsent";

function createMemoryStorage(): ConsentStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
    async removeItem(key) {
      values.delete(key);
    },
  };
}

test("acceptOnboardingConsent persists consent and anonymous install ID", async () => {
  const storage = createMemoryStorage();

  const consent = await acceptOnboardingConsent(
    storage,
    new Date("2026-05-19T00:00:00.000Z"),
  );

  assert.equal(consent.accepted, true);
  assert.equal(consent.acceptedAt, "2026-05-19T00:00:00.000Z");
  assert.match(consent.anonymousInstallId, /^anon_/);
  assert.equal(
    (await getOnboardingConsent(storage))?.anonymousInstallId,
    consent.anonymousInstallId,
  );
});

test("acceptOnboardingConsent reuses an existing anonymous install ID", async () => {
  const storage = createMemoryStorage();

  const first = await acceptOnboardingConsent(storage);
  const second = await acceptOnboardingConsent(storage);

  assert.equal(second.anonymousInstallId, first.anonymousInstallId);
});

test("declineOnboardingConsent blocks app state and creates no install ID", async () => {
  const storage = createMemoryStorage();

  await declineOnboardingConsent(storage);

  assert.equal(await getOnboardingConsent(storage), null);
  assert.equal(storage.values.has(ONBOARDING_CONSENT_STORAGE_KEY), false);
});
