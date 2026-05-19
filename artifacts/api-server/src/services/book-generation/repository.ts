import { asc, desc, eq, or } from "drizzle-orm";
import { db, agentRuns, bookEvents, bookPages, books, learningEvents } from "@workspace/db";
import { buildStructuredBookEvent } from "./eventLog";
import { formatLearningHints } from "./learning";

type JsonRecord = Record<string, unknown>;

export async function createBookRecord(input: {
  mode: string;
  theme?: string;
  pageCount: number;
  characterName: string;
  characterPhotoUri?: string;
  requestJson: JsonRecord;
}) {
  const [book] = await db
    .insert(books)
    .values({
      mode: input.mode,
      theme: input.theme,
      pageCount: input.pageCount,
      characterName: input.characterName,
      characterPhotoUri: input.characterPhotoUri,
      requestJson: input.requestJson,
    })
    .returning();
  return book;
}

export async function updateBookRecord(bookId: string, values: Partial<typeof books.$inferInsert>) {
  const [book] = await db
    .update(books)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(books.id, bookId))
    .returning();
  return book;
}

export async function createPageRecord(input: {
  bookId: string;
  pageNumber: number;
  text?: string;
  illustrationPrompt?: string;
  promptJson?: JsonRecord;
}) {
  const [page] = await db
    .insert(bookPages)
    .values({
      bookId: input.bookId,
      pageNumber: input.pageNumber,
      text: input.text,
      illustrationPrompt: input.illustrationPrompt,
      promptJson: input.promptJson,
    })
    .returning();
  return page;
}

export async function updatePageRecord(pageId: string, values: Partial<typeof bookPages.$inferInsert>) {
  const [page] = await db
    .update(bookPages)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(bookPages.id, pageId))
    .returning();
  return page;
}

export async function logEvent(input: {
  bookId: string;
  pageId?: string;
  agent: string;
  eventType: string;
  payloadJson?: JsonRecord;
}) {
  const event = buildStructuredBookEvent(input);
  await db.insert(bookEvents).values({
    bookId: event.bookId,
    pageId: event.pageId,
    agent: event.agent,
    eventType: event.eventType,
    payloadJson: event.payloadJson,
  });
}

export async function logAgentRun<T>(input: {
  agentName: string;
  bookId: string;
  pageId?: string;
  inputJson?: JsonRecord;
  run: () => Promise<T>;
}) {
  const startedAt = Date.now();
  try {
    const output = await input.run();
    await db.insert(agentRuns).values({
      agentName: input.agentName,
      bookId: input.bookId,
      pageId: input.pageId,
      status: "success",
      durationMs: Date.now() - startedAt,
      inputJson: input.inputJson,
      outputJson: toJsonRecord(output),
    });
    return output;
  } catch (error) {
    await db.insert(agentRuns).values({
      agentName: input.agentName,
      bookId: input.bookId,
      pageId: input.pageId,
      status: "failed",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      inputJson: input.inputJson,
    });
    throw error;
  }
}

export async function recordLearningEvent(input: {
  bookId: string;
  pageId?: string;
  agent: string;
  failureType: string;
  lesson: string;
  payloadJson?: JsonRecord;
}) {
  await db.insert(learningEvents).values({
    bookId: input.bookId,
    pageId: input.pageId,
    agent: input.agent,
    failureType: input.failureType,
    lesson: input.lesson,
    payloadJson: input.payloadJson ?? {},
  });
}

export async function recentLearningHints(limit = 5) {
  const rows = await db
    .select()
    .from(learningEvents)
    .orderBy(desc(learningEvents.createdAt))
    .limit(limit);

  return formatLearningHints(rows);
}

export async function getBookWithPages(bookId: string) {
  const [book] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
  if (!book) return null;
  const pages = await db
    .select()
    .from(bookPages)
    .where(eq(bookPages.bookId, bookId))
    .orderBy(asc(bookPages.pageNumber));
  return { book, pages };
}

export async function getBookEvents(bookId: string) {
  return db
    .select()
    .from(bookEvents)
    .where(eq(bookEvents.bookId, bookId))
    .orderBy(asc(bookEvents.createdAt));
}

export async function getQaBooks() {
  return db
    .select()
    .from(books)
    .where(or(eq(books.flaggedForHuman, true), eq(books.status, "qa_required")))
    .orderBy(desc(books.updatedAt))
    .limit(50);
}

function toJsonRecord(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return { value };
}
