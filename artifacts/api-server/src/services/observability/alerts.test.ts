import assert from "node:assert/strict";
import test from "node:test";
import { buildCriticalAlert } from "./alerts";

test("buildCriticalAlert emits metadata-only critical alert", () => {
  assert.deepEqual(
    buildCriticalAlert({
      type: "stuck_worker",
      metadata: { queueDepth: 5 },
      now: new Date("2026-05-19T00:00:00.000Z"),
    }),
    {
      type: "stuck_worker",
      severity: "critical",
      metadata: { queueDepth: 5 },
      createdAt: "2026-05-19T00:00:00.000Z",
    },
  );
});
