import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const books = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  theme: text("theme"),
  mode: text("mode").notNull(),
  status: text("status").notNull().default("created"),
  currentStep: text("current_step").notNull().default("input"),
  pageCount: integer("page_count").notNull().default(12),
  title: text("title"),
  reflectionQuestion: text("reflection_question"),
  coverImageUrl: text("cover_image_url"),
  characterName: text("character_name").notNull(),
  characterPhotoUri: text("character_photo_uri"),
  characterLock: jsonb("character_lock").$type<Record<string, unknown>>(),
  requestJson: jsonb("request_json").$type<Record<string, unknown>>().notNull(),
  setupJson: jsonb("setup_json").$type<Record<string, unknown>>(),
  packageJson: jsonb("package_json").$type<Record<string, unknown>>(),
  flaggedForHuman: boolean("flagged_for_human").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookPages = pgTable("book_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  currentStep: text("current_step").notNull().default("prompt_builder"),
  status: text("status").notNull().default("created"),
  text: text("text"),
  illustrationPrompt: text("illustration_prompt"),
  promptJson: jsonb("prompt_json").$type<Record<string, unknown>>(),
  candidatesJson: jsonb("candidates_json").$type<Array<Record<string, unknown>>>(),
  alignmentScore: real("alignment_score"),
  retryCount: integer("retry_count").notNull().default(0),
  flagForHuman: boolean("flag_for_human").notNull().default(false),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentName: text("agent_name").notNull(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  pageId: uuid("page_id").references(() => bookPages.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  durationMs: integer("duration_ms").notNull().default(0),
  error: text("error"),
  inputJson: jsonb("input_json").$type<Record<string, unknown>>(),
  outputJson: jsonb("output_json").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookEvents = pgTable("book_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  pageId: uuid("page_id").references(() => bookPages.id, { onDelete: "cascade" }),
  agent: text("agent").notNull(),
  eventType: text("event_type").notNull(),
  payloadJson: jsonb("payload_json").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const learningEvents = pgTable("learning_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  pageId: uuid("page_id").references(() => bookPages.id, { onDelete: "cascade" }),
  agent: text("agent").notNull(),
  failureType: text("failure_type").notNull(),
  lesson: text("lesson").notNull(),
  payloadJson: jsonb("payload_json").$type<Record<string, unknown>>().notNull().default({}),
  reusedAsHint: boolean("reused_as_hint").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const booksRelations = relations(books, ({ many }) => ({
  pages: many(bookPages),
  agentRuns: many(agentRuns),
  events: many(bookEvents),
  learningEvents: many(learningEvents),
}));

export const bookPagesRelations = relations(bookPages, ({ one, many }) => ({
  book: one(books, {
    fields: [bookPages.bookId],
    references: [books.id],
  }),
  agentRuns: many(agentRuns),
  events: many(bookEvents),
  learningEvents: many(learningEvents),
}));

export const agentRunsRelations = relations(agentRuns, ({ one }) => ({
  book: one(books, {
    fields: [agentRuns.bookId],
    references: [books.id],
  }),
  page: one(bookPages, {
    fields: [agentRuns.pageId],
    references: [bookPages.id],
  }),
}));

export const bookEventsRelations = relations(bookEvents, ({ one }) => ({
  book: one(books, {
    fields: [bookEvents.bookId],
    references: [books.id],
  }),
  page: one(bookPages, {
    fields: [bookEvents.pageId],
    references: [bookPages.id],
  }),
}));

export const learningEventsRelations = relations(learningEvents, ({ one }) => ({
  book: one(books, {
    fields: [learningEvents.bookId],
    references: [books.id],
  }),
  page: one(bookPages, {
    fields: [learningEvents.pageId],
    references: [bookPages.id],
  }),
}));

export type Book = typeof books.$inferSelect;
export type BookPage = typeof bookPages.$inferSelect;
export type AgentRun = typeof agentRuns.$inferSelect;
export type BookEvent = typeof bookEvents.$inferSelect;
export type LearningEvent = typeof learningEvents.$inferSelect;
