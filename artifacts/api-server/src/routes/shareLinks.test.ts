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

test("share link opens redacted metadata before revoke", async () => {
  const asset = await privateAssetStore.save({
    ownerUserId: "local_development_user",
    contentType: "text/plain",
    assetKind: "book_html",
    body: "<html>private</html>",
  });
  const createResponse = await fetch(`${baseUrl}/share-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetId: asset.id, title: "Maya Learns Sharing" }),
  });
  assert.equal(createResponse.status, 201);
  const created = (await createResponse.json()) as { token: string };

  const openResponse = await fetch(`${baseUrl}/share-links/${created.token}`);
  assert.equal(openResponse.status, 200);
  const opened = (await openResponse.json()) as { title: string; assetId: string };
  assert.equal(opened.title, "a child a child a child");
  assert.equal(opened.assetId, asset.id);

  const revokeResponse = await fetch(
    `${baseUrl}/share-links/${created.token}/revoke`,
    { method: "POST" },
  );
  assert.equal(revokeResponse.status, 204);

  const revokedResponse = await fetch(`${baseUrl}/share-links/${created.token}`);
  assert.equal(revokedResponse.status, 404);
});
