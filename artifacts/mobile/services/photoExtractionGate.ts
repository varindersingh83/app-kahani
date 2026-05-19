export type PhotoExtractionPlatform = "ios" | "android" | "web" | "unknown";

export type PhotoExtractionGateInput = {
  nodeEnv?: string;
  platform?: PhotoExtractionPlatform;
  enabled?: string | boolean;
  modelVersion?: string;
  modelApproved?: string | boolean;
};

export type PhotoExtractionGate =
  | {
      enabled: true;
      modelVersion: string;
      devOnly: boolean;
    }
  | {
      enabled: false;
      reason:
        | "disabled"
        | "production_model_not_approved"
        | "unsupported_platform";
      devOnly: boolean;
    };

export function getPhotoExtractionGate(
  input: PhotoExtractionGateInput = {},
): PhotoExtractionGate {
  const nodeEnv = input.nodeEnv ?? process.env.NODE_ENV;
  const platform =
    input.platform ??
    (process.env.EXPO_OS as PhotoExtractionPlatform | undefined) ??
    "unknown";
  const enabled =
    input.enabled ?? process.env.EXPO_PUBLIC_ENABLE_LOCAL_PHOTO_EXTRACTION;
  const modelApproved =
    input.modelApproved ?? process.env.EXPO_PUBLIC_LOCAL_PHOTO_MODEL_APPROVED;
  const modelVersion =
    input.modelVersion ?? process.env.EXPO_PUBLIC_LOCAL_PHOTO_MODEL_VERSION;

  const explicitlyEnabled = enabled === true || enabled === "true";
  const explicitlyApproved = modelApproved === true || modelApproved === "true";
  const devOnly = nodeEnv !== "production";

  if (!explicitlyEnabled) {
    return { enabled: false, reason: "disabled", devOnly };
  }

  if (platform !== "ios") {
    return { enabled: false, reason: "unsupported_platform", devOnly };
  }

  if (!modelVersion || (nodeEnv === "production" && !explicitlyApproved)) {
    return {
      enabled: false,
      reason: "production_model_not_approved",
      devOnly,
    };
  }

  return { enabled: true, modelVersion, devOnly };
}
