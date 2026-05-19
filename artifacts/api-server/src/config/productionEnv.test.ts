import assert from "node:assert/strict";
import test from "node:test";
import { REQUIRED_PRODUCTION_ENV, checkProductionEnv } from "./productionEnv";

test("checkProductionEnv passes outside production", () => {
  assert.deepEqual(checkProductionEnv({ NODE_ENV: "development" }), {
    ok: true,
    missing: [],
  });
});

test("checkProductionEnv rejects missing production launch config", () => {
  const result = checkProductionEnv({ NODE_ENV: "production" });

  assert.equal(result.ok, false);
  assert.ok(result.missing.includes("DATABASE_URL"));
  assert.ok(result.missing.includes("KAHANI_ENCRYPTION_KEY_BASE64"));
});

test("checkProductionEnv accepts complete production launch config", () => {
  const env: Record<string, string> = { NODE_ENV: "production" };
  for (const key of REQUIRED_PRODUCTION_ENV) {
    env[key] = "set";
  }
  env.KAHANI_PROVIDER_PHOTO_POLICY = "strip_family_photos";

  assert.deepEqual(checkProductionEnv(env), { ok: true, missing: [] });
});
