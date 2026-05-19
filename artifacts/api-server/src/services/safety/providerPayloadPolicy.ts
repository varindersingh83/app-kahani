export type ProviderReferenceUriKind =
  | "data"
  | "http"
  | "file"
  | "blob"
  | "other";

export function sanitizeProviderReferenceImageUris(
  _referenceImageUris: string[] = [],
) {
  return [];
}

export function assertNoProviderReferenceImages(
  referenceImageUris: string[] = [],
) {
  if (referenceImageUris.length === 0) return;
  throw new Error(
    "Provider image references are disabled for family-photo privacy. Use redacted descriptors instead.",
  );
}

export function describeBlockedReferenceUri(
  uri: string,
): ProviderReferenceUriKind {
  if (uri.startsWith("data:")) return "data";
  if (uri.startsWith("http://") || uri.startsWith("https://")) return "http";
  if (uri.startsWith("file://")) return "file";
  if (uri.startsWith("blob:")) return "blob";
  return "other";
}
