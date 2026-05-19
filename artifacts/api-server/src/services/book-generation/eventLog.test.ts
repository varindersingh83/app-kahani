import assert from "node:assert/strict";
import test from "node:test";
import { buildStructuredBookEvent, toMonitoringEvent } from "./eventLog";

test("event log builder creates structured events with default payload", () => {
  const event = buildStructuredBookEvent({
    bookId: "book-1",
    agent: "InputAgent",
    eventType: "started",
    createdAt: new Date("2026-04-23T10:00:00.000Z"),
  });

  assert.equal(event.bookId, "book-1");
  assert.equal(event.agent, "InputAgent");
  assert.equal(event.eventType, "started");
  assert.deepEqual(event.payloadJson, {});
  assert.equal(event.createdAt.toISOString(), "2026-04-23T10:00:00.000Z");
});

test("event log builder preserves page id and payload for page-level events", () => {
  const event = buildStructuredBookEvent({
    bookId: "book-1",
    pageId: "page-3",
    agent: "AlignmentAgent",
    eventType: "score_generated",
    payloadJson: { score: 0.71, status: "retry" },
    createdAt: new Date("2026-04-23T10:01:00.000Z"),
  });

  assert.equal(event.pageId, "page-3");
  assert.deepEqual(event.payloadJson, { score: 0.71, status: "retry" });
});

test("monitoring event shape matches logs-first debugging format", () => {
  const event = buildStructuredBookEvent({
    bookId: "BK-1042",
    pageId: "3",
    agent: "AlignmentAgent",
    eventType: "score_generated",
    payloadJson: { score: 0.71, status: "retry" },
    createdAt: new Date("2026-04-23T10:02:00.000Z"),
  });

  assert.deepEqual(toMonitoringEvent(event), {
    timestamp: "2026-04-23T10:02:00.000Z",
    book_id: "BK-1042",
    page_id: "3",
    agent: "AlignmentAgent",
    event: "score_generated",
    score: 0.71,
    status: "retry",
  });
});
