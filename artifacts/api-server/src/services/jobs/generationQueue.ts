export type DurableGenerationJob = {
  id: string;
  userId: string;
  status: "queued" | "running" | "complete" | "failed";
  attemptCount: number;
  maxAttempts: number;
  requestJson: Record<string, unknown>;
  resultJson?: Record<string, unknown>;
  errorCode?: string;
  heartbeatAt?: string;
  createdAt: string;
  updatedAt: string;
};

export function createGenerationQueue() {
  const jobs = new Map<string, DurableGenerationJob>();

  return {
    enqueue(input: {
      id: string;
      userId: string;
      requestJson: Record<string, unknown>;
      maxAttempts?: number;
    }) {
      const now = new Date().toISOString();
      const job: DurableGenerationJob = {
        id: input.id,
        userId: input.userId,
        status: "queued",
        attemptCount: 0,
        maxAttempts: input.maxAttempts ?? 3,
        requestJson: input.requestJson,
        createdAt: now,
        updatedAt: now,
      };
      jobs.set(job.id, job);
      return job;
    },
    claimNext() {
      const job = [...jobs.values()].find((candidate) => candidate.status === "queued");
      if (!job) return null;
      job.status = "running";
      job.attemptCount += 1;
      job.heartbeatAt = new Date().toISOString();
      job.updatedAt = job.heartbeatAt;
      return job;
    },
    heartbeat(jobId: string) {
      const job = jobs.get(jobId);
      if (!job || job.status !== "running") return null;
      job.heartbeatAt = new Date().toISOString();
      job.updatedAt = job.heartbeatAt;
      return job;
    },
    complete(jobId: string, resultJson: Record<string, unknown>) {
      const job = jobs.get(jobId);
      if (!job) return null;
      job.status = "complete";
      job.resultJson = resultJson;
      job.updatedAt = new Date().toISOString();
      return job;
    },
    failOrRetry(jobId: string, errorCode: string) {
      const job = jobs.get(jobId);
      if (!job) return null;
      job.errorCode = errorCode;
      job.status = job.attemptCount < job.maxAttempts ? "queued" : "failed";
      job.updatedAt = new Date().toISOString();
      return job;
    },
    get(jobId: string) {
      return jobs.get(jobId) ?? null;
    },
  };
}
