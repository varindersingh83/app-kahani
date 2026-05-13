import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id").notNull(),
    ...timestamps,
  },
  (table) => ({
    clerkUserIdIdx: uniqueIndex("users_clerk_user_id_idx").on(
      table.clerkUserId,
    ),
  }),
);

export const photoAssetsTable = pgTable(
  "photo_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => usersTable.id),
    storageProvider: text("storage_provider").notNull(),
    bucket: text("bucket").notNull(),
    objectKey: text("object_key").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    checksum: text("checksum"),
    ...timestamps,
  },
  (table) => ({
    ownerIdx: index("photo_assets_owner_idx").on(table.ownerId),
    objectKeyIdx: uniqueIndex("photo_assets_object_key_idx").on(
      table.objectKey,
    ),
  }),
);

export const charactersTable = pgTable(
  "characters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => usersTable.id),
    displayName: text("display_name").notNull(),
    photoAssetId: uuid("photo_asset_id").references(() => photoAssetsTable.id),
    ...timestamps,
  },
  (table) => ({
    ownerIdx: index("characters_owner_idx").on(table.ownerId),
  }),
);

export const booksTable = pgTable(
  "books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => usersTable.id),
    characterId: uuid("character_id").references(() => charactersTable.id),
    title: text("title").notNull(),
    normalizedBehavior: text("normalized_behavior"),
    status: text("status").notNull().default("draft"),
    ...timestamps,
  },
  (table) => ({
    ownerIdx: index("books_owner_idx").on(table.ownerId),
    ownerCreatedAtIdx: index("books_owner_created_at_idx").on(
      table.ownerId,
      table.createdAt,
    ),
  }),
);

export const generatedAssetsTable = pgTable(
  "generated_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => usersTable.id),
    bookId: uuid("book_id").references(() => booksTable.id),
    storageProvider: text("storage_provider").notNull(),
    bucket: text("bucket").notNull(),
    objectKey: text("object_key").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size"),
    assetRole: text("asset_role").notNull(),
    ...timestamps,
  },
  (table) => ({
    ownerIdx: index("generated_assets_owner_idx").on(table.ownerId),
    bookIdx: index("generated_assets_book_idx").on(table.bookId),
    objectKeyIdx: uniqueIndex("generated_assets_object_key_idx").on(
      table.objectKey,
    ),
  }),
);

export const bookPagesTable = pgTable(
  "book_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => booksTable.id),
    pageNumber: integer("page_number").notNull(),
    storyText: text("story_text").notNull(),
    scene: text("scene"),
    composition: text("composition"),
    emotion: text("emotion"),
    imageAssetId: uuid("image_asset_id").references(
      () => generatedAssetsTable.id,
    ),
    ...timestamps,
  },
  (table) => ({
    bookIdx: index("book_pages_book_idx").on(table.bookId),
    bookPageIdx: uniqueIndex("book_pages_book_page_idx").on(
      table.bookId,
      table.pageNumber,
    ),
  }),
);

export const generationJobsTable = pgTable(
  "generation_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => usersTable.id),
    bookId: uuid("book_id").references(() => booksTable.id),
    status: text("status").notNull(),
    step: text("step").notNull(),
    sanitizedErrorCode: text("sanitized_error_code"),
    activeIssue: text("active_issue"),
    ...timestamps,
  },
  (table) => ({
    ownerIdx: index("generation_jobs_owner_idx").on(table.ownerId),
    statusIdx: index("generation_jobs_status_idx").on(table.status),
    bookIdx: index("generation_jobs_book_idx").on(table.bookId),
  }),
);

export const generationEventsTable = pgTable(
  "generation_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => generationJobsTable.id),
    eventType: text("event_type").notNull(),
    sanitizedMessage: text("sanitized_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    jobIdx: index("generation_events_job_idx").on(table.jobId),
  }),
);

export const guardrailResultsTable = pgTable(
  "guardrail_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").references(() => usersTable.id),
    requestId: text("request_id"),
    verdict: text("verdict").notNull(),
    score: numeric("score", { precision: 5, scale: 4 }),
    categories: jsonb("categories").$type<string[]>().notNull().default([]),
    patternIds: jsonb("pattern_ids").$type<string[]>().notNull().default([]),
    promptLength: integer("prompt_length").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index("guardrail_results_owner_idx").on(table.ownerId),
    verdictIdx: index("guardrail_results_verdict_idx").on(table.verdict),
  }),
);

export const usageEventsTable = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").references(() => usersTable.id),
    jobId: uuid("job_id").references(() => generationJobsTable.id),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    imageCount: integer("image_count"),
    costEstimate: numeric("cost_estimate", { precision: 12, scale: 6 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index("usage_events_owner_idx").on(table.ownerId),
    jobIdx: index("usage_events_job_idx").on(table.jobId),
  }),
);

export type User = typeof usersTable.$inferSelect;
export type Character = typeof charactersTable.$inferSelect;
export type Book = typeof booksTable.$inferSelect;
export type BookPage = typeof bookPagesTable.$inferSelect;
export type PhotoAsset = typeof photoAssetsTable.$inferSelect;
export type GeneratedAsset = typeof generatedAssetsTable.$inferSelect;
export type GenerationJob = typeof generationJobsTable.$inferSelect;
export type GenerationEvent = typeof generationEventsTable.$inferSelect;
export type GuardrailResult = typeof guardrailResultsTable.$inferSelect;
export type UsageEvent = typeof usageEventsTable.$inferSelect;
