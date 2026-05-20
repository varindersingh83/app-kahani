export type PhotoTraitPolicyInput = {
  hairColor?: string;
  clothingColors?: string[];
  glasses?: boolean;
  presentation?: "child" | "adult";
  confidence?: number;
};

export type PhotoTraitPolicyResult =
  | {
      ok: true;
      descriptor: string;
    }
  | {
      ok: false;
      reason:
        | "low_confidence"
        | "disallowed_field"
        | "disallowed_value"
        | "empty_descriptor";
    };

const ALLOWED_KEYS = new Set([
  "hairColor",
  "clothingColors",
  "glasses",
  "presentation",
  "confidence",
]);

const ALLOWED_COLORS = new Set([
  "black",
  "blonde",
  "blue",
  "brown",
  "gray",
  "green",
  "pink",
  "purple",
  "red",
  "white",
  "yellow",
]);

const DISALLOWED_VALUE_PATTERN =
  /(asian|attractive|autis|black person|blind|disabled|ethnic|fat|health|hispanic|indian|latino|race|racial|skin|thin|white person)/i;

export function buildSafePhotoTraitDescriptor(
  input: Record<string, unknown>,
): PhotoTraitPolicyResult {
  for (const key of Object.keys(input)) {
    if (!ALLOWED_KEYS.has(key)) {
      return { ok: false, reason: "disallowed_field" };
    }
  }

  const candidate = input as PhotoTraitPolicyInput;
  if (typeof candidate.confidence === "number" && candidate.confidence < 0.8) {
    return { ok: false, reason: "low_confidence" };
  }

  const parts: string[] = [];
  const hairColor = normalizeColor(candidate.hairColor);
  if (hairColor) {
    parts.push(`${hairColor} hair`);
  } else if (candidate.hairColor) {
    return { ok: false, reason: "disallowed_value" };
  }

  const clothingColors = candidate.clothingColors ?? [];
  const safeClothingColors: string[] = [];
  for (const color of clothingColors) {
    const normalized = normalizeColor(color);
    if (!normalized) return { ok: false, reason: "disallowed_value" };
    safeClothingColors.push(normalized);
  }
  if (safeClothingColors.length > 0) {
    parts.push(`${safeClothingColors.slice(0, 2).join(" and ")} clothing`);
  }

  if (candidate.glasses === true) {
    parts.push("glasses");
  }

  if (candidate.presentation) {
    if (candidate.presentation !== "child" && candidate.presentation !== "adult") {
      return { ok: false, reason: "disallowed_value" };
    }
    parts.push(`${candidate.presentation} character`);
  }

  if (parts.length === 0) {
    return { ok: false, reason: "empty_descriptor" };
  }

  return { ok: true, descriptor: `Appearance descriptor: ${parts.join(", ")}.` };
}

function normalizeColor(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || DISALLOWED_VALUE_PATTERN.test(normalized)) return null;
  return ALLOWED_COLORS.has(normalized) ? normalized : null;
}
