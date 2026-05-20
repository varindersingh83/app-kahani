import { getPhotoExtractionAvailability, type PhotoExtractionAvailability } from "./photoExtractionGate";
import { buildSafePhotoTraitDescriptor, type PhotoTraitPolicyInput } from "./photoTraitPolicy";

export type LocalPhotoAsset = {
  uri?: string;
  width?: number;
  height?: number;
};

export type PhotoTraitExtractionResult =
  | {
      ok: true;
      descriptor: string;
      modelVersion: string;
    }
  | {
      ok: false;
      reason:
        | "ambiguous_subject"
        | "low_confidence"
        | "manual_fallback_required"
        | "model_unavailable"
        | "photo_too_small"
        | "policy_rejected"
        | "unsupported_platform";
    };

export type PhotoTraitAdapter = (
  asset: LocalPhotoAsset,
  availability: Extract<PhotoExtractionAvailability, { available: true }>,
) => Promise<PhotoTraitPolicyInput | null>;

export async function extractPhotoTraits(input: {
  asset: LocalPhotoAsset;
  availability?: PhotoExtractionAvailability;
  adapter?: PhotoTraitAdapter;
}): Promise<PhotoTraitExtractionResult> {
  const availability = input.availability ?? getPhotoExtractionAvailability();
  if (!availability.available) {
    return {
      ok: false,
      reason:
        availability.reason === "unsupported_platform"
          ? "unsupported_platform"
          : "model_unavailable",
    };
  }

  if ((input.asset.width ?? 0) < 256 || (input.asset.height ?? 0) < 256) {
    return { ok: false, reason: "photo_too_small" };
  }

  const traits = await (input.adapter ?? defaultLocalPhotoAdapter)(
    input.asset,
    availability,
  );
  if (!traits) return { ok: false, reason: "manual_fallback_required" };

  const policy = buildSafePhotoTraitDescriptor(traits as Record<string, unknown>);
  if (!policy.ok) {
    return {
      ok: false,
      reason:
        policy.reason === "low_confidence" ? "low_confidence" : "policy_rejected",
    };
  }

  return {
    ok: true,
    descriptor: policy.descriptor,
    modelVersion: availability.modelVersion,
  };
}

async function defaultLocalPhotoAdapter(
  _asset: LocalPhotoAsset,
  availability: Extract<PhotoExtractionAvailability, { available: true }>,
) {
  if (availability.mode !== "dev-mock") return null;

  return {
    hairColor: "brown",
    clothingColors: ["blue"],
    presentation: "child",
    confidence: 0.95,
  } satisfies PhotoTraitPolicyInput;
}
