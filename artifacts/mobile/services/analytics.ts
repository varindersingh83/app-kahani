export type AnalyticsEventName =
  | "photo_check_attempted"
  | "photo_check_succeeded"
  | "photo_check_failed"
  | "photo_retry_used"
  | "manual_fallback_used"
  | "character_created"
  | "generation_after_extraction";

export type AnalyticsPayloadValue = string | number | boolean | null;
export type AnalyticsPayload = Record<string, AnalyticsPayloadValue>;

const ALLOWED_PAYLOAD_KEYS = new Set([
  "appVersion",
  "durationBucket",
  "eventVersion",
  "failureCategory",
  "modelVersion",
  "platform",
  "retryCount",
  "source",
]);

const FORBIDDEN_KEY_PATTERN =
  /(child|character|descriptor|generated|image|manual|name|photo|prompt|trait|uri|url)/i;
const FORBIDDEN_STRING_PATTERN =
  /(data:image|blob:|file:\/\/|https?:\/\/|base64,|prompt:|photoUri)/i;

export function sanitizeAnalyticsPayload(payload: AnalyticsPayload = {}) {
  const sanitized: AnalyticsPayload = {};

  for (const [key, value] of Object.entries(payload)) {
    if (!ALLOWED_PAYLOAD_KEYS.has(key) || FORBIDDEN_KEY_PATTERN.test(key)) {
      throw new Error(`Analytics payload key is not allowed: ${key}`);
    }

    if (typeof value === "string" && FORBIDDEN_STRING_PATTERN.test(value)) {
      throw new Error(`Analytics payload value is not allowed for key: ${key}`);
    }

    sanitized[key] = value;
  }

  return sanitized;
}

export function createAnalyticsEvent(
  name: AnalyticsEventName,
  payload: AnalyticsPayload = {},
) {
  return {
    name,
    payload: sanitizeAnalyticsPayload(payload),
  };
}

export function createAnonymousInstallId(seed = Math.random().toString(36)) {
  return `kahani-install-${Date.now().toString(36)}-${seed
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 12)}`;
}
