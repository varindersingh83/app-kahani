export type ApprovedPhotoTraits = {
  hairColor?: string;
  skinToneRange?: string;
  clothingColors?: string[];
  glasses?: boolean;
  ageBand?: "toddler" | "child" | "preteen" | "teen" | "adult";
};

export type PhotoTraitPolicyResult =
  | {
      ok: true;
      traits: ApprovedPhotoTraits;
    }
  | {
      ok: false;
      reason: "empty" | "disallowed_category" | "invalid_value";
      category?: string;
    };

const ALLOWED_KEYS = new Set([
  "hairColor",
  "skinToneRange",
  "clothingColors",
  "glasses",
  "ageBand",
]);

const AGE_BANDS = new Set([
  "toddler",
  "child",
  "preteen",
  "teen",
  "adult",
]);

export function validatePhotoTraits(
  rawTraits: Record<string, unknown>,
): PhotoTraitPolicyResult {
  const entries = Object.entries(rawTraits);
  if (entries.length === 0) return { ok: false, reason: "empty" };

  for (const [key] of entries) {
    if (!ALLOWED_KEYS.has(key)) {
      return { ok: false, reason: "disallowed_category", category: key };
    }
  }

  const traits: ApprovedPhotoTraits = {};

  if (rawTraits.hairColor !== undefined) {
    if (typeof rawTraits.hairColor !== "string") {
      return { ok: false, reason: "invalid_value", category: "hairColor" };
    }
    traits.hairColor = rawTraits.hairColor;
  }

  if (rawTraits.skinToneRange !== undefined) {
    if (typeof rawTraits.skinToneRange !== "string") {
      return { ok: false, reason: "invalid_value", category: "skinToneRange" };
    }
    traits.skinToneRange = rawTraits.skinToneRange;
  }

  if (rawTraits.clothingColors !== undefined) {
    if (
      !Array.isArray(rawTraits.clothingColors) ||
      !rawTraits.clothingColors.every((value) => typeof value === "string")
    ) {
      return {
        ok: false,
        reason: "invalid_value",
        category: "clothingColors",
      };
    }
    traits.clothingColors = rawTraits.clothingColors;
  }

  if (rawTraits.glasses !== undefined) {
    if (typeof rawTraits.glasses !== "boolean") {
      return { ok: false, reason: "invalid_value", category: "glasses" };
    }
    traits.glasses = rawTraits.glasses;
  }

  if (rawTraits.ageBand !== undefined) {
    if (
      typeof rawTraits.ageBand !== "string" ||
      !AGE_BANDS.has(rawTraits.ageBand)
    ) {
      return { ok: false, reason: "invalid_value", category: "ageBand" };
    }
    traits.ageBand = rawTraits.ageBand as ApprovedPhotoTraits["ageBand"];
  }

  return { ok: true, traits };
}

export function buildLocalPhotoDescriptor(traits: ApprovedPhotoTraits) {
  const parts: string[] = [];
  if (traits.hairColor) parts.push(`${traits.hairColor} hair`);
  if (traits.skinToneRange) parts.push(`${traits.skinToneRange} skin tone`);
  if (traits.clothingColors?.length) {
    parts.push(`${traits.clothingColors.join(" and ")} clothing`);
  }
  if (traits.glasses) parts.push("glasses");
  if (traits.ageBand) parts.push(`${traits.ageBand} age band`);

  return parts.length
    ? `Use only these locally extracted coarse visual traits: ${parts.join(", ")}.`
    : "Use a generic character; no local visual traits were available.";
}
