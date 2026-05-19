import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const generationJobs = pgTable("generation_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  idempotencyKey: text("idempotency_key"),
  status: text("status").notNull().default("queued"),
  attemptCount: integer("attempt_count").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  requestJsonEncrypted: text("request_json_encrypted").notNull(),
  resultJsonEncrypted: text("result_json_encrypted"),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>(),
});
