import assert from "node:assert/strict";
import test from "node:test";
import { createDeletionService } from "./deletionService";

test("deletion service rejects unauthenticated users", async () => {
  const service = createDeletionService();

  const decision = await service.requestDeletion({
    user: null,
    reauthenticatedAt: "2026-05-19T00:00:00.000Z",
  });

  assert.deepEqual(decision, {
    allowed: false,
    status: 401,
    code: "auth_required",
    message: "Sign in is required.",
  });
});

test("deletion service requires fresh reauthentication", async () => {
  const service = createDeletionService({
    now: () => new Date("2026-05-19T00:20:00.000Z"),
  });

  const decision = await service.requestDeletion({
    user: { userId: "user_1", isDevelopmentBypass: false },
    reauthenticatedAt: "2026-05-19T00:00:00.000Z",
  });

  assert.equal(decision.allowed, false);
  if (!decision.allowed) {
    assert.equal(decision.code, "fresh_reauth_required");
  }
});

test("deletion service queues request and emits metadata-only audit event", async () => {
  const service = createDeletionService({
    now: () => new Date("2026-05-19T00:05:00.000Z"),
  });

  const decision = await service.requestDeletion({
    user: { userId: "user_1", isDevelopmentBypass: false },
    reauthenticatedAt: "2026-05-19T00:00:00.000Z",
  });

  assert.equal(decision.allowed, true);
  if (decision.allowed) {
    assert.equal(decision.request.status, "queued");
    assert.equal(decision.auditEvent.eventType, "account.deletion_requested");
    assert.deepEqual(decision.auditEvent.metadata, {
      source: "account_route",
      deletionRequestStatus: "queued",
    });
  }
});
