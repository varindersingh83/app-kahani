export type CharacterRole = "child" | "adult";
export type CharacterPresentation = "girl" | "boy" | "neutral";

export type CharacterCreationPolicy = {
  canUsePhotoPicker: boolean;
  canUseManualAppearanceNotes: boolean;
};

export type CharacterCreationConfig = {
  nodeEnv?: string;
  localPhotoExtractionEnabled?: string | boolean;
};

export function getCharacterCreationPolicy(
  config: CharacterCreationConfig = {},
): CharacterCreationPolicy {
  const nodeEnv = config.nodeEnv ?? process.env.NODE_ENV;
  const extractionEnabled =
    config.localPhotoExtractionEnabled ??
    process.env.EXPO_PUBLIC_ENABLE_LOCAL_PHOTO_EXTRACTION;
  const explicitExtractionEnabled =
    extractionEnabled === true || extractionEnabled === "true";

  if (nodeEnv === "production") {
    return {
      canUsePhotoPicker: explicitExtractionEnabled,
      canUseManualAppearanceNotes: false,
    };
  }

  return {
    canUsePhotoPicker: true,
    canUseManualAppearanceNotes: true,
  };
}

export function buildGenericCharacterAppearance(input: {
  role: CharacterRole;
  presentation: CharacterPresentation;
}) {
  const rolePhrase =
    input.role === "adult" ? "adult caregiver" : "child protagonist";
  const presentationPhrase =
    input.presentation === "neutral"
      ? "neutral presentation"
      : `${input.presentation} presentation`;

  return `Use a generic ${rolePhrase} with ${presentationPhrase}. Do not infer private traits from the character name.`;
}

export function sanitizeCharacterForGeneration(input: {
  name: string;
  role?: CharacterRole;
  presentation?: CharacterPresentation;
  appearance?: string;
  photoUri?: string;
}) {
  const role = input.role ?? "child";
  const presentation = input.presentation ?? "neutral";

  return {
    name: input.name.trim(),
    role,
    presentation,
    appearance:
      input.appearance?.trim() ||
      buildGenericCharacterAppearance({ role, presentation }),
  };
}
