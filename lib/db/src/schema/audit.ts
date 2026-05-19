import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  eventType: text("event_type").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const consentRecords = pgTable("consent_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  consentType: text("consent_type").notNull(),
  version: text("version").notNull(),
  consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
  anonymousInstallIdEncrypted: text("anonymous_install_id_encrypted"),
  metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const deletionRequests = pgTable("deletion_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("queued"),
  requestedAt: timestamp("requested_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  reauthenticatedAt: timestamp("reauthenticated_at", {
    withTimezone: true,
  }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  failureCode: text("failure_code"),
  metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>().notNull(),
});
