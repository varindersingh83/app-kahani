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
  assert.equal(tableName(users), "users");
  assert.equal(tableName(characters), "characters");
  assert.equal(tableName(generationJobs), "generation_jobs");
  assert.equal(tableName(assets), "assets");
  assert.equal(tableName(auditEvents), "audit_events");
  assert.equal(tableName(books), "books");
  assert.equal(tableName(bookPages), "book_pages");
  assert.equal(tableName(bookEvents), "book_events");
  assert.equal(tableName(agentRuns), "agent_runs");
  assert.equal(tableName(learningEvents), "learning_events");
});

function tableName(table: unknown) {
  return (table as Record<symbol, string>)[Symbol.for("drizzle:Name")];
}
