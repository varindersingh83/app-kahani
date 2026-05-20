export type PhotoExtractionAvailability =
  | {
      available: true;
      mode: "approved-model" | "dev-mock";
      modelVersion: string;
    }
  | {
      available: false;
      reason:
        | "disabled"
        | "model_not_approved"
        | "unsupported_platform"
        | "production_dev_mock_blocked";
    };

export type PhotoExtractionGateInput = {
  enabled?: string | boolean;
  modelApproved?: string | boolean;
  devMockEnabled?: string | boolean;
  nodeEnv?: string;
  platform?: string;
  modelVersion?: string;
};

export function getPhotoExtractionAvailability(
  input: PhotoExtractionGateInput = {},
): PhotoExtractionAvailability {
  const enabled = readBoolean(input.enabled);
  const modelApproved = readBoolean(input.modelApproved);
  const devMockEnabled = readBoolean(input.devMockEnabled);
  const nodeEnv = input.nodeEnv ?? process.env.NODE_ENV ?? "development";
  const platform = input.platform ?? "unknown";

  if (!enabled) return { available: false, reason: "disabled" };

  if (platform !== "ios" && platform !== "web") {
    return { available: false, reason: "unsupported_platform" };
  }

  if (modelApproved) {
    return {
      available: true,
      mode: "approved-model",
      modelVersion: input.modelVersion ?? "unversioned-local-model",
    };
  }

  if (devMockEnabled) {
    if (nodeEnv === "production") {
      return { available: false, reason: "production_dev_mock_blocked" };
    }

    return {
      available: true,
      mode: "dev-mock",
      modelVersion: "dev-mock-local-photo-v1",
    };
  }

  return { available: false, reason: "model_not_approved" };
}

export function getRuntimePhotoExtractionAvailability(platform: string) {
  return getPhotoExtractionAvailability({
    enabled: process.env.EXPO_PUBLIC_ENABLE_LOCAL_PHOTO_EXTRACTION,
    modelApproved: process.env.EXPO_PUBLIC_LOCAL_PHOTO_MODEL_APPROVED,
    devMockEnabled: process.env.EXPO_PUBLIC_LOCAL_PHOTO_EXTRACTION_DEV_MOCK,
    modelVersion: process.env.EXPO_PUBLIC_LOCAL_PHOTO_MODEL_VERSION,
    platform,
  });
}

function readBoolean(value: string | boolean | undefined) {
  if (typeof value === "boolean") return value;
  return /^(1|true|yes)$/i.test(value?.trim() ?? "");
}
