import assert from "node:assert/strict";
import test from "node:test";
import { createShareLinkService } from "./shareLinkService";

test("share links are accessible before 24-hour expiry with redacted title", () => {
  const service = createShareLinkService({
    now: () => new Date("2026-05-19T00:00:00.000Z"),
  });

  const link = service.create({
    assetId: "asset_1",
    ownerUserId: "user_1",
    title: "Maya Learns Sharing",
  });
  const access = service.access(link.token);

  assert.equal(access.allowed, true);
  if (access.allowed) {
    assert.equal(access.redactedTitle, "a child a child a child");
    assert.equal(access.link.accessCount, 1);
  }
});

test("share links block expired and revoked access", () => {
  let now = new Date("2026-05-19T00:00:00.000Z");
  const service = createShareLinkService({ now: () => now });
  const link = service.create({ assetId: "asset_1", ownerUserId: "user_1" });

  now = new Date("2026-05-20T00:00:00.001Z");
  assert.deepEqual(service.access(link.token), {
    allowed: false,
    reason: "expired",
  });

  now = new Date("2026-05-19T00:00:00.000Z");
  const revoked = service.create({ assetId: "asset_2", ownerUserId: "user_1" });
  assert.equal(service.revoke({ token: revoked.token, ownerUserId: "user_1" }), true);
  assert.deepEqual(service.access(revoked.token), {
    allowed: false,
    reason: "revoked",
  });
});
