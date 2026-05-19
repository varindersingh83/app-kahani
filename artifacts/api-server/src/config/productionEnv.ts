export type ProductionEnvCheck = {
  ok: boolean;
  missing: string[];
};

export const REQUIRED_PRODUCTION_ENV = [
  "PORT",
  "DATABASE_URL",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "KAHANI_ENCRYPTION_KEY_BASE64",
  "KAHANI_PRIVATE_ASSET_STORE",
  "KAHANI_ALERT_WEBHOOK_URL",
  "KAHANI_ANALYTICS_WRITE_KEY",
  "AI_INTEGRATIONS_OPENROUTER_BASE_URL",
  "AI_INTEGRATIONS_OPENROUTER_API_KEY",
  "AI_INTEGRATIONS_OPENROUTER_MODEL",
  "AI_INTEGRATIONS_OPENROUTER_IMAGE_MODEL",
  "KAHANI_PROVIDER_PHOTO_POLICY",
  "KAHANI_ONBOARDING_CONSENT_VERSION",
] as const;

export function checkProductionEnv(
  env: Record<string, string | undefined> = process.env,
): ProductionEnvCheck {
  if (env.NODE_ENV !== "production") return { ok: true, missing: [] };

  const missing: string[] = REQUIRED_PRODUCTION_ENV.filter((key) => !env[key]);
  if (env.KAHANI_PROVIDER_PHOTO_POLICY !== "strip_family_photos") {
    missing.push("KAHANI_PROVIDER_PHOTO_POLICY=strip_family_photos");
  }

  return { ok: missing.length === 0, missing };
}

export function assertProductionEnv(
  env: Record<string, string | undefined> = process.env,
) {
  const result = checkProductionEnv(env);
  if (!result.ok) {
    throw new Error(
      `Missing required production configuration: ${result.missing.join(", ")}`,
    );
  }
}
