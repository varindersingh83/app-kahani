import assert from "node:assert/strict";
import test from "node:test";
import type { Request } from "express";
import { requireUser } from "./requireUser";

test("uses Clerk user id when present", () => {
  const user = requireUser({
    auth: { userId: "user_123" },
  } as unknown as Request);

  assert.deepEqual(user, {
    userId: "user_123",
    isDevelopmentBypass: false,
  });
});

test("allows explicit local development bypass without Clerk env", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousPublishable = process.env.CLERK_PUBLISHABLE_KEY;
  const previousSecret = process.env.CLERK_SECRET_KEY;
  process.env.NODE_ENV = "development";
  delete process.env.CLERK_PUBLISHABLE_KEY;
  delete process.env.CLERK_SECRET_KEY;

  try {
    const user = requireUser({} as Request);
    assert.deepEqual(user, {
      userId: "local_development_user",
      isDevelopmentBypass: true,
    });
  } finally {
    restoreEnv("NODE_ENV", previousNodeEnv);
    restoreEnv("CLERK_PUBLISHABLE_KEY", previousPublishable);
    restoreEnv("CLERK_SECRET_KEY", previousSecret);
  }
});

test("fails closed in production without a Clerk user", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    assert.equal(requireUser({} as Request), null);
  } finally {
    restoreEnv("NODE_ENV", previousNodeEnv);
  }
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
