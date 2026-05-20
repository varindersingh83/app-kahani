export type RuntimeConfigInput = {
  apiBaseUrl?: string;
  domain?: string;
  clerkPublishableKey?: string;
};

export type AuthRuntimeMode =
  | "clerk"
  | "local-development-bypass"
  | "missing-clerk-for-remote-api";

export function getAuthRuntimeMode({
  apiBaseUrl,
  domain,
  clerkPublishableKey,
}: RuntimeConfigInput): AuthRuntimeMode {
  if (hasValue(clerkPublishableKey)) {
    return "clerk";
  }

  if (usesRemoteApi({ apiBaseUrl, domain })) {
    return "missing-clerk-for-remote-api";
  }

  return "local-development-bypass";
}

export function usesRemoteApi({ apiBaseUrl, domain }: RuntimeConfigInput) {
  const normalizedApiBaseUrl = apiBaseUrl?.trim();
  if (normalizedApiBaseUrl) {
    return !isLocalUrl(normalizedApiBaseUrl);
  }

  const normalizedDomain = domain?.trim();
  if (normalizedDomain) {
    return !isLocalHost(normalizedDomain);
  }

  return false;
}

function hasValue(value?: string) {
  return Boolean(value?.trim());
}

function isLocalUrl(value: string) {
  try {
    return isLocalHost(new URL(value).hostname);
  } catch {
    return false;
  }
}

function isLocalHost(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost")
  );
}
