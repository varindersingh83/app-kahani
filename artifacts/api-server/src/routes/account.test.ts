import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import app from "../app";

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

test("POST /account/deletion-request rejects missing reauth timestamp", async () => {
  const response = await fetch(`${baseUrl}/account/deletion-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 400);
  const body = (await response.json()) as { code?: string };
  assert.equal(body.code, "invalid_reauth_timestamp");
});

test("POST /account/deletion-request queues deletion after fresh reauth", async () => {
  const response = await fetch(`${baseUrl}/account/deletion-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reauthenticatedAt: new Date().toISOString() }),
  });

  assert.equal(response.status, 202);
  const body = (await response.json()) as {
    deletionRequestId?: string;
    status?: string;
  };
  assert.match(body.deletionRequestId ?? "", /^del_/);
  assert.equal(body.status, "queued");
});
