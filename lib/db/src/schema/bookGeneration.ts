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

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(),
  mode: text("mode").notNull(),
  theme: text("theme"),
  pageCount: integer("page_count").notNull(),
  status: text("status").notNull().default("queued"),
  currentStep: text("current_step").notNull().default("queued"),
  title: text("title"),
  reflectionQuestion: text("reflection_question"),
  coverImageUrl: text("cover_image_url"),
  characterName: text("character_name").notNull(),
  characterPhotoUri: text("character_photo_uri"),
  requestJson: jsonb("request_json").$type<Record<string, unknown>>().notNull(),
  setupJson: jsonb("setup_json").$type<Record<string, unknown>>(),
  characterLock: jsonb("character_lock").$type<Record<string, unknown>>(),
  packageJson: jsonb("package_json").$type<Record<string, unknown>>(),
  flaggedForHuman: boolean("flagged_for_human").notNull().default(false),
  ...timestamps,
});

export const bookPages = pgTable("book_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  currentStep: text("current_step").notNull().default("queued"),
  status: text("status").notNull().default("queued"),
  text: text("text"),
  illustrationPrompt: text("illustration_prompt"),
  promptJson: jsonb("prompt_json").$type<Record<string, unknown>>(),
  retryCount: integer("retry_count").notNull().default(0),
  flagForHuman: boolean("flag_for_human").notNull().default(false),
  failureReason: text("failure_reason"),
  alignmentScore: real("alignment_score"),
  ...timestamps,
});

export const bookEvents = pgTable("book_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  pageId: uuid("page_id").references(() => bookPages.id, {
    onDelete: "set null",
  }),
  agent: text("agent").notNull(),
  eventType: text("event_type").notNull(),
  payloadJson: jsonb("payload_json").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentName: text("agent_name").notNull(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  pageId: uuid("page_id").references(() => bookPages.id, {
    onDelete: "set null",
  }),
  status: text("status").notNull(),
  durationMs: integer("duration_ms").notNull(),
  inputJson: jsonb("input_json").$type<Record<string, unknown>>(),
  outputJson: jsonb("output_json").$type<Record<string, unknown>>(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const learningEvents = pgTable("learning_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  pageId: uuid("page_id").references(() => bookPages.id, {
    onDelete: "set null",
  }),
  agent: text("agent").notNull(),
  failureType: text("failure_type").notNull(),
  lesson: text("lesson").notNull(),
  payloadJson: jsonb("payload_json").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
