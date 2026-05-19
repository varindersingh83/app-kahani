import { getPhotoExtractionGate } from "./photoExtractionGate";

export type CharacterRole = "child" | "adult";
export type CharacterPresentation = "girl" | "boy" | "neutral";

export type CharacterCreationPolicy = {
  canUsePhotoPicker: boolean;
  canUseManualAppearanceNotes: boolean;
};

export type CharacterCreationConfig = {
  nodeEnv?: string;
  platform?: "ios" | "android" | "web" | "unknown";
  localPhotoExtractionEnabled?: string | boolean;
  localPhotoExtractionModelVersion?: string;
  localPhotoExtractionModelApproved?: string | boolean;
};

export function getCharacterCreationPolicy(
  config: CharacterCreationConfig = {},
): CharacterCreationPolicy {
  const nodeEnv = config.nodeEnv ?? process.env.NODE_ENV;
  const extractionGate = getPhotoExtractionGate({
    nodeEnv,
    platform: config.platform,
    enabled: config.localPhotoExtractionEnabled,
    modelVersion: config.localPhotoExtractionModelVersion,
    modelApproved: config.localPhotoExtractionModelApproved,
  });

  if (nodeEnv === "production") {
    return {
      canUsePhotoPicker: extractionGate.enabled,
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
