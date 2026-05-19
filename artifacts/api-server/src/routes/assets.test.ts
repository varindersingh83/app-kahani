import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import app from "../app";
import { privateAssetStore } from "./assets";

let server: Server;
let baseUrl: string;

before(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind a TCP port.");
  }
  baseUrl = `http://127.0.0.1:${address.port}/api`;
});

after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test("GET /assets/:assetId returns private asset to authenticated owner", async () => {
  const asset = await privateAssetStore.save({
    ownerUserId: "local_development_user",
    contentType: "text/plain",
    assetKind: "story_json",
    body: "private story",
  });

  const response = await fetch(`${baseUrl}/assets/${asset.id}`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(await response.text(), "private story");
});
