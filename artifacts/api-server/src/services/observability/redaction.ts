const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|prompt|photo|image|descriptor|trait|name|content|story|pageText|providerPayload|url|uri)/i;

export function redactSensitiveFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitiveFields);
  if (!value || typeof value !== "object") return value;

  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    output[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? "[REDACTED]"
      : redactSensitiveFields(nested);
  }
  return output;
}
