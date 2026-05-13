const REQUIRED_PRODUCTION_ENV = [
  "DATABASE_URL",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "AI_INTEGRATIONS_OPENROUTER_BASE_URL",
  "AI_INTEGRATIONS_OPENROUTER_API_KEY",
  "AI_INTEGRATIONS_OPENROUTER_MODEL",
  "AI_INTEGRATIONS_OPENROUTER_IMAGE_MODEL",
] as const;

export function validateProductionEnv() {
  if (process.env.NODE_ENV !== "production") return;

  const missing = REQUIRED_PRODUCTION_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    );
  }
}
