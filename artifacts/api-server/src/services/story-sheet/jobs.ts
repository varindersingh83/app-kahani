import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { GenerateStoryRequest } from "@workspace/api-zod";
import type { AiConfig, StorySheetJob } from "./types";
import { runStorySheetGeneration } from "./generator";
import { buildMultiIssueNotice, planStoryIssues } from "./planner";
import { storySheetRunDir } from "./paths";

const jobs = new Map<string, StorySheetJob>();

const stepMessages = {
  queued: "Waiting to start",
  writing_story: "Writing the story text",
  painting_sheet: "Painting the storyboard sheet",
  slicing_pages: "Slicing the painted sheet into reader pages",
  preparing_reader: "Preparing the book reader",
  complete: "Book is ready",
  failed: "Book generation failed",
} as const;

export async function startStorySheetJob(
  request: GenerateStoryRequest,
  config: AiConfig,
) {
  const bookId = randomUUID();
  const outputDir = storySheetRunDir(bookId);
  const now = new Date().toISOString();
  const plannedIssues = planStoryIssues(request);
  const activeIssue = plannedIssues[0]?.issue;
  const job: StorySheetJob = {
    bookId,
    status: "queued",
    step: "queued",
    message: stepMessages.queued,
    createdAt: now,
    updatedAt: now,
    outputDir,
    request,
    plannedIssues,
    activeIssue,
    issueNotice: buildMultiIssueNotice(plannedIssues),
  };

  jobs.set(bookId, job);
  await mkdir(outputDir, { recursive: true });
  await persistJob(job);

  void runJob(bookId, config);

  return job;
}

export async function readStorySheetJob(bookId: string) {
  const inMemory = jobs.get(bookId);
  if (inMemory) return inMemory;

  try {
    const raw = await readFile(
      path.join(storySheetRunDir(bookId), "job.json"),
      "utf8",
    );
    const job = JSON.parse(raw) as StorySheetJob;
    jobs.set(bookId, job);
    return job;
  } catch {
    return null;
  }
}

async function runJob(bookId: string, config: AiConfig) {
  const job = jobs.get(bookId);
  if (!job) return;

  try {
    await updateJob(bookId, {
      status: "running",
      step: "writing_story",
      message: stepMessages.writing_story,
    });

    const result = await runStorySheetGeneration({
      bookId,
      request: job.request,
      outputDir: job.outputDir,
      config,
      onStep: async (step, message) => {
        await updateJob(bookId, { status: "running", step, message });
      },
    });

    await updateJob(bookId, {
      status: "complete",
      step: "complete",
      message: stepMessages.complete,
      story: result.story,
    });
  } catch (error) {
    await updateJob(bookId, {
      status: "failed",
      step: "failed",
      message: stepMessages.failed,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function updateJob(bookId: string, updates: Partial<StorySheetJob>) {
  const existing = jobs.get(bookId);
  if (!existing) return null;
  const next = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  jobs.set(bookId, next);
  await persistJob(next);
  return next;
}

async function persistJob(job: StorySheetJob) {
  await writeFile(
    path.join(job.outputDir, "job.json"),
    `${JSON.stringify(job, null, 2)}\n`,
  );
}
