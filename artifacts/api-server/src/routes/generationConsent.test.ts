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

test("POST /stories/generate blocks normal prompts without external text AI consent", async () => {
  const response = await fetch(`${baseUrl}/stories/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "behavior",
      prompt: "Meltdowns during transitions",
      character: { name: "Maya" },
    }),
  });

  assert.equal(response.status, 403);
  const body = (await response.json()) as { code?: string; message?: string };
  assert.equal(body.code, "external_text_ai_consent_required");
  assert.match(body.message ?? "", /external AI text provider/i);
});

test("POST /stories/generate continues to generation config after consent", async () => {
  const response = await fetch(`${baseUrl}/stories/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "behavior",
      prompt: "Meltdowns during transitions",
      character: { name: "Maya" },
      externalTextAiConsent: true,
    }),
  });

  assert.equal(response.status, 503);
  const body = (await response.json()) as { message?: string };
  assert.equal(body.message, "Story generation is not configured.");
});

test("POST /books blocks normal prompts without external text AI consent", async () => {
  const response = await fetch(`${baseUrl}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "behavior",
      prompt: "Refusing to brush teeth",
      character: { name: "Maya" },
    }),
  });

  assert.equal(response.status, 403);
  const body = (await response.json()) as { code?: string };
  assert.equal(body.code, "external_text_ai_consent_required");
});
