import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAnonymousInstallId } from "./analytics";

export const ONBOARDING_CONSENT_VERSION = "2026-05-19";
export const ONBOARDING_CONSENT_STORAGE_KEY = "kahani:onboarding-consent";

export type ConsentStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export type OnboardingConsentState = {
  accepted: true;
  version: typeof ONBOARDING_CONSENT_VERSION;
  acceptedAt: string;
  anonymousInstallId: string;
};

export async function getOnboardingConsent(
  storage: ConsentStorage = AsyncStorage,
): Promise<OnboardingConsentState | null> {
  const raw = await storage.getItem(ONBOARDING_CONSENT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingConsentState>;
    if (
      parsed.accepted === true &&
      parsed.version === ONBOARDING_CONSENT_VERSION &&
      typeof parsed.acceptedAt === "string" &&
      typeof parsed.anonymousInstallId === "string" &&
      parsed.anonymousInstallId.startsWith("anon_")
    ) {
      return parsed as OnboardingConsentState;
    }
  } catch {
    return null;
  }

  return null;
}

export async function acceptOnboardingConsent(
  storage: ConsentStorage = AsyncStorage,
  now = new Date(),
): Promise<OnboardingConsentState> {
  const existing = await getOnboardingConsent(storage);
  if (existing) return existing;

  const state: OnboardingConsentState = {
    accepted: true,
    version: ONBOARDING_CONSENT_VERSION,
    acceptedAt: now.toISOString(),
    anonymousInstallId: createAnonymousInstallId(),
  };
  await storage.setItem(ONBOARDING_CONSENT_STORAGE_KEY, JSON.stringify(state));
  return state;
}

export async function declineOnboardingConsent(
  storage: ConsentStorage = AsyncStorage,
) {
  await storage.removeItem(ONBOARDING_CONSENT_STORAGE_KEY);
}
