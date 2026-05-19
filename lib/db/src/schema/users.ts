import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  onboardingConsentVersion: text("onboarding_consent_version"),
  onboardingConsentedAt: timestamp("onboarding_consented_at", {
    withTimezone: true,
  }),
  externalTextAiConsentVersion: text("external_text_ai_consent_version"),
  externalTextAiConsentedAt: timestamp("external_text_ai_consented_at", {
    withTimezone: true,
  }),
  anonymousAnalyticsInstallIdEncrypted: text(
    "anonymous_analytics_install_id_encrypted",
  ),
  improvementOptIn: boolean("improvement_opt_in").notNull().default(false),
  deletionRequestedAt: timestamp("deletion_requested_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
