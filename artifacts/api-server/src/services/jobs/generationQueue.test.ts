import assert from "node:assert/strict";
import test from "node:test";
import { createGenerationQueue } from "./generationQueue";

test("generation queue claims, heartbeats, and completes jobs", () => {
  const queue = createGenerationQueue();
  queue.enqueue({ id: "job_1", userId: "user_1", requestJson: {} });

  const claimed = queue.claimNext();
  assert.equal(claimed?.status, "running");
  assert.equal(claimed?.attemptCount, 1);
  assert.equal(queue.heartbeat("job_1")?.status, "running");
  assert.equal(queue.complete("job_1", { ok: true })?.status, "complete");
});

test("generation queue retries until retry budget is exhausted", () => {
  const queue = createGenerationQueue();
  queue.enqueue({
    id: "job_1",
    userId: "user_1",
    requestJson: {},
    maxAttempts: 2,
  });

  queue.claimNext();
  assert.equal(queue.failOrRetry("job_1", "provider_error")?.status, "queued");
  queue.claimNext();
  assert.equal(queue.failOrRetry("job_1", "provider_error")?.status, "failed");
});
