export const ONBOARDING_CONSENT_STORAGE_KEY = "kahani:onboarding-consent";
export const ONBOARDING_CONSENT_VERSION = "2026-05-20-local-photo-v1";

export type OnboardingConsentState = {
  status: "accepted" | "declined";
  version: string;
  decidedAt: string;
};

export function createAcceptedConsent(
  decidedAt = new Date().toISOString(),
): OnboardingConsentState {
  return {
    status: "accepted",
    version: ONBOARDING_CONSENT_VERSION,
    decidedAt,
  };
}

export function createDeclinedConsent(
  decidedAt = new Date().toISOString(),
): OnboardingConsentState {
  return {
    status: "declined",
    version: ONBOARDING_CONSENT_VERSION,
    decidedAt,
  };
}

export function hasRequiredOnboardingConsent(
  consent: OnboardingConsentState | null | undefined,
) {
  return (
    consent?.status === "accepted" &&
    consent.version === ONBOARDING_CONSENT_VERSION
  );
}

export function parseOnboardingConsent(
  raw: string | null | undefined,
): OnboardingConsentState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingConsentState>;
    if (
      (parsed.status === "accepted" || parsed.status === "declined") &&
      typeof parsed.version === "string" &&
      typeof parsed.decidedAt === "string"
    ) {
      return {
        status: parsed.status,
        version: parsed.version,
        decidedAt: parsed.decidedAt,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function serializeOnboardingConsent(consent: OnboardingConsentState) {
  return JSON.stringify(consent);
}
