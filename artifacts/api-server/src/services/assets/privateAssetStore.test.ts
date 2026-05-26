import assert from "node:assert/strict";
import test from "node:test";
import { createInMemoryPrivateAssetStore } from "./privateAssetStore";

test("private asset store returns assets only to the owner", async () => {
  const store = createInMemoryPrivateAssetStore();
  const asset = await store.save({
    ownerUserId: "user_1",
    contentType: "text/plain",
    assetKind: "story_json",
    body: "private",
  });

  assert.equal(
    (await store.readForOwner({ assetId: asset.id, ownerUserId: "user_1" }))
      ?.body.toString(),
    "private",
  );
  assert.equal(
    await store.readForOwner({ assetId: asset.id, ownerUserId: "user_2" }),
    null,
  );
});

test("private asset store hides deleted assets", async () => {
  const store = createInMemoryPrivateAssetStore();
  const asset = await store.save({
    ownerUserId: "user_1",
    contentType: "text/plain",
    assetKind: "story_json",
    body: "private",
  });

  assert.equal(
    await store.deleteForOwner({ assetId: asset.id, ownerUserId: "user_1" }),
    true,
  );
  assert.equal(
    await store.readForOwner({ assetId: asset.id, ownerUserId: "user_1" }),
    null,
  );
});
