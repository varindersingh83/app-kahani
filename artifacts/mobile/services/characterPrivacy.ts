export type AppearanceSource = "generic" | "local-photo" | "manual";

export type PrivacySafeCharacter = {
  id: string;
  name: string;
  relationship?: "child" | "mom" | "dad";
  appearance?: string;
  appearanceSource?: AppearanceSource;
};

export type PhotoCreationDecision =
  | {
      action: "save";
      appearance: string;
      appearanceSource: "local-photo";
    }
  | {
      action: "retry";
      message: string;
    }
  | {
      action: "manual_fallback";
      message: string;
    };

export function sanitizeCharacterForStorage<T extends Record<string, unknown>>(
  character: T,
): Omit<T, "photoUri"> & { appearanceSource?: AppearanceSource } {
  const { photoUri: _photoUri, ...rest } = character;
  const source =
    rest.appearanceSource === "local-photo" ||
    rest.appearanceSource === "manual" ||
    rest.appearanceSource === "generic"
      ? rest.appearanceSource
      : rest.appearance
        ? "manual"
        : "generic";

  return {
    ...rest,
    appearanceSource: source,
  } as Omit<T, "photoUri"> & { appearanceSource?: AppearanceSource };
}

export function sanitizeCharactersForStorage<
  T extends Record<string, unknown>,
>(characters: T[]) {
  return characters.map(sanitizeCharacterForStorage);
}

export function decidePhotoCreationFlow(input: {
  extraction:
    | { ok: true; descriptor: string }
    | { ok: false; reason: string };
  retryCount: number;
}): PhotoCreationDecision {
  if (input.extraction.ok) {
    return {
      action: "save",
      appearance: input.extraction.descriptor,
      appearanceSource: "local-photo",
    };
  }

  if (input.retryCount < 1) {
    return {
      action: "retry",
      message:
        "We could not read that photo clearly. Try one well-lit photo with one person centered.",
    };
  }

  return {
    action: "manual_fallback",
    message:
      "Use a few simple details instead. Do not include race, health, body size, or identity details.",
  };
}
