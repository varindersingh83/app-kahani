import assert from "node:assert/strict";
import test from "node:test";
import { createIdempotencyStore } from "./idempotency";

test("idempotency store reuses the same job for duplicate user key", () => {
  const store = createIdempotencyStore();
  let next = 0;
  const createJobId = () => `job_${++next}`;

  assert.deepEqual(
    store.resolve({ userId: "user_1", key: "tap", createJobId }),
    { jobId: "job_1", reused: false },
  );
  assert.deepEqual(
    store.resolve({ userId: "user_1", key: "tap", createJobId }),
    { jobId: "job_1", reused: true },
  );
  assert.deepEqual(
    store.resolve({ userId: "user_2", key: "tap", createJobId }),
    { jobId: "job_2", reused: false },
  );
});
