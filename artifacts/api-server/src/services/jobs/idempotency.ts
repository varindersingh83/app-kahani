export type IdempotencyRecord = {
  key: string;
  userId: string;
  jobId: string;
  createdAt: string;
};

export function createIdempotencyStore() {
  const records = new Map<string, IdempotencyRecord>();

  return {
    resolve(input: { userId: string; key?: string; createJobId: () => string }) {
      if (!input.key) return { jobId: input.createJobId(), reused: false };

      const scopedKey = `${input.userId}:${input.key}`;
      const existing = records.get(scopedKey);
      if (existing) return { jobId: existing.jobId, reused: true };

      const jobId = input.createJobId();
      records.set(scopedKey, {
        key: input.key,
        userId: input.userId,
        jobId,
        createdAt: new Date().toISOString(),
      });
      return { jobId, reused: false };
    },
  };
}
