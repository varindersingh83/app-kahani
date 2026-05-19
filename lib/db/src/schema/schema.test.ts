import assert from "node:assert/strict";
import test from "node:test";
import {
  agentRuns,
  assets,
  auditEvents,
  bookEvents,
  bookPages,
  books,
  characters,
  generationJobs,
  learningEvents,
  users,
} from "./index";

test("exports production-readiness database tables", () => {
  assert.equal(users[Symbol.for("drizzle:Name")], "users");
  assert.equal(characters[Symbol.for("drizzle:Name")], "characters");
  assert.equal(generationJobs[Symbol.for("drizzle:Name")], "generation_jobs");
  assert.equal(assets[Symbol.for("drizzle:Name")], "assets");
  assert.equal(auditEvents[Symbol.for("drizzle:Name")], "audit_events");
  assert.equal(books[Symbol.for("drizzle:Name")], "books");
  assert.equal(bookPages[Symbol.for("drizzle:Name")], "book_pages");
  assert.equal(bookEvents[Symbol.for("drizzle:Name")], "book_events");
  assert.equal(agentRuns[Symbol.for("drizzle:Name")], "agent_runs");
  assert.equal(learningEvents[Symbol.for("drizzle:Name")], "learning_events");
});
