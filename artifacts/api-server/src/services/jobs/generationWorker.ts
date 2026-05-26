import type { DurableGenerationJob } from "./generationQueue";

export type GenerationQueueLike = {
  claimNext(): DurableGenerationJob | null;
  complete(jobId: string, resultJson: Record<string, unknown>): DurableGenerationJob | null;
  failOrRetry(jobId: string, errorCode: string): DurableGenerationJob | null;
};

export async function processOneGenerationJob(input: {
  queue: GenerationQueueLike;
  run: (job: DurableGenerationJob) => Promise<Record<string, unknown>>;
}) {
  const job = input.queue.claimNext();
  if (!job) return { processed: false as const };

  try {
    const result = await input.run(job);
    input.queue.complete(job.id, result);
    return { processed: true as const, status: "complete" as const, jobId: job.id };
  } catch (error) {
    const failed = input.queue.failOrRetry(
      job.id,
      error instanceof Error ? error.message : "unknown_error",
    );
    return {
      processed: true as const,
      status: failed?.status ?? "failed",
      jobId: job.id,
    };
  }
}
