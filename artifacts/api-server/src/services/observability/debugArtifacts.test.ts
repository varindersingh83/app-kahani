import assert from "node:assert/strict";
import test from "node:test";
import { buildDebugArtifact } from "./debugArtifacts";

test("buildDebugArtifact stores only redacted context with retention", () => {
  assert.deepEqual(
    buildDebugArtifact({
      jobId: "job_1",
      failureCategory: "provider_error",
      context: { prompt: "sharing", statusCode: 500 },
      now: new Date("2026-05-19T00:00:00.000Z"),
      retentionDays: 1,
    }),
    {
      jobId: "job_1",
      failureCategory: "provider_error",
      redactedContext: { prompt: "[REDACTED]", statusCode: 500 },
      retainUntil: "2026-05-20T00:00:00.000Z",
    },
  );
});
