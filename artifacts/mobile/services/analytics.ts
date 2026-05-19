export const ANALYTICS_SCHEMA_VERSION = "2026-05-19";

export const ANALYTICS_EVENTS = [
  "flow_started",
  "flow_completed",
  "flow_abandoned",
  "extraction_attempted",
  "extraction_succeeded",
  "extraction_failed",
  "generation_started",
  "generation_completed",
  "generation_failed",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsMetadata = Partial<{
  flow: "onboarding" | "character_creation" | "story_generation";
  step: string;
  dropOffStep: string;
  failureCategory:
    | "permission_denied"
    | "model_unavailable"
    | "timeout"
    | "low_confidence"
    | "policy_rejected"
    | "network"
    | "unknown";
  modelVersion: string;
  durationBucket: "under_1s" | "1_3s" | "3_10s" | "over_10s";
  platform: "ios" | "android" | "web" | "unknown";
  appVersion: string;
  generationAfterExtraction: boolean;
}>;

export type AnalyticsEnvelope = {
  event: AnalyticsEventName;
  anonymousInstallId: string;
  schemaVersion: typeof ANALYTICS_SCHEMA_VERSION;
  metadata: AnalyticsMetadata;
  createdAt: string;
};

const EVENT_SET = new Set<string>(ANALYTICS_EVENTS);
const METADATA_KEYS = new Set<string>([
  "flow",
  "step",
  "dropOffStep",
  "failureCategory",
  "modelVersion",
  "durationBucket",
  "platform",
  "appVersion",
  "generationAfterExtraction",
]);

const SENSITIVE_KEY_PATTERN =
  /(name|prompt|photo|image|url|uri|trait|descriptor|character|child|account|user|clerk|story|book)/i;

export function createAnonymousInstallId() {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) return `anon_${randomUuid}`;

  return `anon_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

export function buildAnalyticsEnvelope(input: {
  event: string;
  anonymousInstallId: string;
  metadata?: Record<string, unknown>;
  now?: Date;
}): AnalyticsEnvelope {
  if (!EVENT_SET.has(input.event)) {
    throw new Error(`Analytics event is not allowlisted: ${input.event}`);
  }
  if (!input.anonymousInstallId.startsWith("anon_")) {
    throw new Error("Analytics install ID must be anonymous.");
  }

  return {
    event: input.event as AnalyticsEventName,
    anonymousInstallId: input.anonymousInstallId,
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    metadata: sanitizeAnalyticsMetadata(input.metadata ?? {}),
    createdAt: (input.now ?? new Date()).toISOString(),
  };
}

export function sanitizeAnalyticsMetadata(
  metadata: Record<string, unknown>,
): AnalyticsMetadata {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (!METADATA_KEYS.has(key) || SENSITIVE_KEY_PATTERN.test(key)) {
      throw new Error(`Analytics metadata key is not allowlisted: ${key}`);
    }
    if (!isPrimitiveMetadataValue(value)) {
      throw new Error(`Analytics metadata value is not allowed for: ${key}`);
    }
    sanitized[key] = value;
  }

  return sanitized as AnalyticsMetadata;
}

function isPrimitiveMetadataValue(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}
