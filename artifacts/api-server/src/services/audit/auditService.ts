export type AuditEventInput = {
  actorUserId?: string;
  eventType: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

export type AuditEvent = Required<Pick<AuditEventInput, "eventType">> &
  Omit<AuditEventInput, "eventType"> & {
    metadata: Record<string, unknown>;
    createdAt: string;
  };

const SENSITIVE_AUDIT_KEY_PATTERN =
  /(prompt|photo|image|descriptor|trait|name|url|uri|content|storyText|pageText)/i;

export function buildAuditEvent(input: AuditEventInput): AuditEvent {
  return {
    actorUserId: input.actorUserId,
    eventType: input.eventType,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: sanitizeAuditMetadata(input.metadata ?? {}),
    createdAt: new Date().toISOString(),
  };
}

export function sanitizeAuditMetadata(metadata: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_AUDIT_KEY_PATTERN.test(key)) {
      throw new Error(`Audit metadata key is not allowed: ${key}`);
    }
    if (
      value !== null &&
      value !== undefined &&
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      throw new Error(`Audit metadata value is not allowed: ${key}`);
    }
    sanitized[key] = value;
  }
  return sanitized;
}
