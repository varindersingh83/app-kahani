export type AppearanceSource = "generic" | "local-photo" | "manual";
export type CharacterImageSource = "generated-cartoon";

export type PrivacySafeCharacter = {
  id: string;
  name: string;
  relationship?: "child" | "mom" | "dad";
  appearance?: string;
  appearanceSource?: AppearanceSource;
  characterImageUri?: string;
  characterImageSource?: CharacterImageSource;
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
): Omit<T, "photoUri"> & {
  appearanceSource?: AppearanceSource;
  characterImageUri?: string;
  characterImageSource?: CharacterImageSource;
} {
  const { photoUri: _photoUri, ...rest } = character;
  const source =
    rest.appearanceSource === "local-photo" ||
    rest.appearanceSource === "manual" ||
    rest.appearanceSource === "generic"
      ? rest.appearanceSource
      : rest.appearance
        ? "manual"
        : "generic";

  const characterImageSource =
    rest.characterImageSource === "generated-cartoon"
      ? rest.characterImageSource
      : undefined;
  const characterImageUri =
    characterImageSource && isSafeGeneratedCartoonUri(rest.characterImageUri)
      ? rest.characterImageUri
      : undefined;

  const sanitized = {
    ...rest,
    appearanceSource: source,
  } as Omit<T, "photoUri"> & {
    appearanceSource?: AppearanceSource;
    characterImageUri?: string;
    characterImageSource?: CharacterImageSource;
  };

  if (characterImageUri) {
    sanitized.characterImageUri = characterImageUri;
    sanitized.characterImageSource = "generated-cartoon";
  } else {
    delete sanitized.characterImageUri;
    delete sanitized.characterImageSource;
  }

  return sanitized;
}

export function sanitizeCharactersForStorage<T extends Record<string, unknown>>(
  characters: T[],
) {
  return characters.map(sanitizeCharacterForStorage);
}

export function decidePhotoCreationFlow(input: {
  extraction: { ok: true; descriptor: string } | { ok: false; reason: string };
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

function isSafeGeneratedCartoonUri(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!/^data:image\/svg\+xml(?:;charset=utf-8)?,/i.test(trimmed)) {
    return false;
  }

  try {
    const svg = decodeURIComponent(trimmed.split(",", 2)[1] ?? "");
    return (
      svg.includes('data-kahani-cartoon="v1"') &&
      !/data:image|base64,|https?:\/\/|file:\/\/|blob:/i.test(svg) &&
      !/<(?:script|image|foreignObject|iframe|object|embed|style)\b/i.test(
        svg,
      ) &&
      !/\b(?:href|src|style|on[a-z]+)=/i.test(svg) &&
      !/url\s*\(/i.test(svg) &&
      !/<(?!\/?(?:svg|rect|circle|path)\b)[^>]+>/i.test(svg)
    );
  } catch {
    return false;
  }
}
