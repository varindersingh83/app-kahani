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
  const withoutIpv6Brackets =
    normalized.startsWith("[") && normalized.endsWith("]")
      ? normalized.slice(1, -1)
      : normalized;

  return (
    normalized === "localhost" ||
    withoutIpv6Brackets === "127.0.0.1" ||
    withoutIpv6Brackets === "::1" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    isPrivateIpv4Host(withoutIpv6Brackets)
  );
}

function isPrivateIpv4Host(hostname: string) {
  const parts = hostname.split(".");
  if (parts.length !== 4) return false;

  const octets = parts.map((part) => {
    if (!/^\d+$/.test(part)) return Number.NaN;
    return Number(part);
  });

  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const [first, second] = octets;
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}
