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

test("allows local development bypass for LAN API without Clerk", () => {
  for (const apiBaseUrl of [
    "http://192.168.1.22:8080",
    "http://10.0.0.7:8080",
    "http://172.20.4.12:8080",
    "http://169.254.10.2:8080",
    "http://varinders-macbook.local:8080",
  ]) {
    assert.equal(
      getAuthRuntimeMode({
        apiBaseUrl,
        clerkPublishableKey: "",
      }),
      "local-development-bypass",
      apiBaseUrl,
    );
  }
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
