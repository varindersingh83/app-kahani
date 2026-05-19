import assert from "node:assert/strict";
import test from "node:test";
import { buildAuditEvent } from "./auditService";

test("buildAuditEvent accepts metadata-only audit payloads", () => {
  const event = buildAuditEvent({
    actorUserId: "user_1",
    eventType: "account.deletion_requested",
    metadata: { source: "account_route", retryable: true },
  });

  assert.equal(event.eventType, "account.deletion_requested");
  assert.deepEqual(event.metadata, {
    source: "account_route",
    retryable: true,
  });
});

test("buildAuditEvent rejects raw content and photo fields", () => {
  for (const key of ["prompt", "photoUri", "descriptor", "imageUrl", "name"]) {
    assert.throws(
      () =>
        buildAuditEvent({
          eventType: "unsafe",
          metadata: { [key]: "sensitive" },
        }),
      /not allowed/,
      key,
    );
  }
});
