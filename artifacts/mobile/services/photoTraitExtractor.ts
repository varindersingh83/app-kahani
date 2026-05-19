import {
  buildLocalPhotoDescriptor,
  validatePhotoTraits,
  type ApprovedPhotoTraits,
} from "./photoTraitPolicy";
import type { PhotoExtractionGate } from "./photoExtractionGate";

export type PhotoTraitExtractionAdapter = {
  extract(photoUri: string): Promise<Record<string, unknown>>;
};

export type PhotoTraitExtractionResult =
  | {
      status: "succeeded";
      modelVersion: string;
      traits: ApprovedPhotoTraits;
      descriptor: string;
    }
  | {
      status: "fallback";
      reason:
        | "disabled"
        | "unsupported_platform"
        | "production_model_not_approved"
        | "adapter_unavailable"
        | "timeout"
        | "policy_rejected"
        | "model_error";
    };

export async function extractPhotoTraits(input: {
  photoUri: string;
  gate: PhotoExtractionGate;
  adapter?: PhotoTraitExtractionAdapter;
  timeoutMs?: number;
}): Promise<PhotoTraitExtractionResult> {
  if (!input.gate.enabled) {
    return { status: "fallback", reason: input.gate.reason };
  }
  if (!input.adapter) {
    return { status: "fallback", reason: "adapter_unavailable" };
  }

  try {
    const rawTraits = await withTimeout(
      input.adapter.extract(input.photoUri),
      input.timeoutMs ?? 1000,
    );
    const policy = validatePhotoTraits(rawTraits);
    if (!policy.ok) {
      return { status: "fallback", reason: "policy_rejected" };
    }

    return {
      status: "succeeded",
      modelVersion: input.gate.modelVersion,
      traits: policy.traits,
      descriptor: buildLocalPhotoDescriptor(policy.traits),
    };
  } catch (error) {
    return {
      status: "fallback",
      reason: error instanceof TimeoutError ? "timeout" : "model_error",
    };
  }
}

class TimeoutError extends Error {}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new TimeoutError()), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
