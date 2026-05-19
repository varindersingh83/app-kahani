import { redactSensitiveFields } from "./redaction";

export type DebugArtifact = {
  jobId: string;
  failureCategory: string;
  redactedContext: unknown;
  retainUntil: string;
};

export function buildDebugArtifact(input: {
  jobId: string;
  failureCategory: string;
  context: unknown;
  now?: Date;
  retentionDays?: number;
}): DebugArtifact {
  const now = input.now ?? new Date();
  return {
    jobId: input.jobId,
    failureCategory: input.failureCategory,
    redactedContext: redactSensitiveFields(input.context),
    retainUntil: new Date(
      now.getTime() + (input.retentionDays ?? 7) * 24 * 60 * 60 * 1000,
    ).toISOString(),
  };
}
