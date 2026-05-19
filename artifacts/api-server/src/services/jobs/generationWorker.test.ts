import assert from "node:assert/strict";
import test from "node:test";
import { createGenerationQueue } from "./generationQueue";
import { processOneGenerationJob } from "./generationWorker";

test("generation worker completes one queued job", async () => {
  const queue = createGenerationQueue();
  queue.enqueue({ id: "job_1", userId: "user_1", requestJson: {} });

  const result = await processOneGenerationJob({
    queue,
    async run() {
      return { story: "done" };
    },
  });

  assert.deepEqual(result, {
    processed: true,
    status: "complete",
    jobId: "job_1",
  });
  assert.equal(queue.get("job_1")?.status, "complete");
});

test("generation worker returns failed after retry budget", async () => {
  const queue = createGenerationQueue();
  queue.enqueue({
    id: "job_1",
    userId: "user_1",
    requestJson: {},
    maxAttempts: 1,
  });

  const result = await processOneGenerationJob({
    queue,
    async run() {
      throw new Error("provider_error");
    },
  });

  assert.equal(result.status, "failed");
  assert.equal(queue.get("job_1")?.errorCode, "provider_error");
});
