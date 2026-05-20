import assert from "node:assert/strict";
import test from "node:test";
import { getAuthRuntimeMode } from "./runtimeConfig";

test("uses Clerk when the mobile publishable key is present", () => {
  assert.equal(
    getAuthRuntimeMode({
      apiBaseUrl: "https://app-kahani-staging.onrender.com",
      clerkPublishableKey: "pk_test_example",
    }),
    "clerk",
  );
});

test("allows local development bypass for localhost API without Clerk", () => {
  assert.equal(
    getAuthRuntimeMode({
      apiBaseUrl: "http://localhost:8080",
      clerkPublishableKey: "",
    }),
    "local-development-bypass",
  );
});

test("blocks remote API builds that omit the mobile Clerk key", () => {
  assert.equal(
    getAuthRuntimeMode({
      apiBaseUrl: "https://app-kahani-staging.onrender.com",
      clerkPublishableKey: "",
    }),
    "missing-clerk-for-remote-api",
  );
});
