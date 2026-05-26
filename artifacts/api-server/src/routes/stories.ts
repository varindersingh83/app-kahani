import { Router, type IRouter } from "express";
import { GenerateStoryBody } from "@workspace/api-zod";
import { getAiConfig } from "../services/story-sheet/aiClient";
import {
  readStorySheetJob,
  startStorySheetJob,
} from "../services/story-sheet/jobs";
import type { StorySheetGeneratedStory } from "../services/story-sheet/types";
import { classifyStoryRequest } from "../services/story-sheet/planner";
import {
  evaluateInputGuardrails,
  inputGuardrailMessage,
} from "../services/safety/inputGuardrails";
import { buildInputGuardrailEvent } from "../services/safety/safetyEvents";
import { requireUser } from "../services/auth/requireUser";
import { requireExternalTextAiConsent } from "../services/consent/consentService";

const router: IRouter = Router();

router.post("/stories/generate", async (req, res) => {
  try {
    const body = GenerateStoryBody.parse(req.body);
    const user = requireUser(req);
    if (!user) {
      res.status(401).json({ message: "Sign in is required." });
      return;
    }

    const guardrail = evaluateInputGuardrails(body);
    if (!guardrail.allowed) {
      req.log.warn(
        { guardrail: buildInputGuardrailEvent(body, guardrail) },
        "Story request blocked by input guardrail",
      );
      res.status(400).json({
        message: inputGuardrailMessage(guardrail),
        code: "input_guardrail_blocked",
        category: guardrail.category,
      });
      return;
    }

    const classification = classifyStoryRequest(body);
    if (classification.status === "blocked") {
      res.status(400).json({
        message: classification.message,
        code: "input_guardrail_blocked",
        category: classification.reasonCategory,
      });
      return;
    }

    if (classification.status === "needs_clarification") {
      res.status(200).json({
        status: "needs_clarification",
        message: "Kahani needs one more detail before making the story.",
        clarification: {
          question: classification.question,
          choices: classification.choices,
        },
      });
      return;
    }

    const consent = requireExternalTextAiConsent(body);
    if (!consent.allowed) {
      res.status(403).json({
        message: consent.message,
        code: consent.code,
      });
      return;
    }

    const config = getAiConfig();
    if (!config) {
      res.status(503).json({ message: "Story generation is not configured." });
      return;
    }

    const job = await startStorySheetJob(body, config, classification);
    res.status(202).json({
      bookId: job.bookId,
      status: job.status,
      step: job.step,
      message: job.message,
      activeIssue: job.activeIssue,
      issueNotice: job.issueNotice,
      behaviorFocus: job.behaviorFocus,
      parentNote: job.parentNote,
      classification: job.behaviorFocus,
    });
  } catch (error) {
    req.log.error({ err: error }, "Story job could not start");
    res.status(400).json({ message: "The story request is invalid." });
  }
});

router.get("/stories/:bookId/status", async (req, res) => {
  const job = await readStorySheetJob(req.params.bookId);
  if (!job) {
    res.status(404).json({ message: "Story job not found." });
    return;
  }

  res.json({
    bookId: job.bookId,
    status: job.status,
    step: job.step,
    message: job.message,
    error: job.error,
    activeIssue: job.activeIssue,
    issueNotice: job.issueNotice,
    behaviorFocus: job.behaviorFocus,
    parentNote: job.parentNote,
    classification: job.behaviorFocus,
  });
});

router.get("/stories/:bookId", async (req, res) => {
  const job = await readStorySheetJob(req.params.bookId);
  if (!job) {
    res.status(404).json({ message: "Story job not found." });
    return;
  }

  if (job.status !== "complete" || !job.story) {
    res.status(409).json({
      bookId: job.bookId,
      status: job.status,
      step: job.step,
      message: job.message,
      error: job.error,
      activeIssue: job.activeIssue,
      issueNotice: job.issueNotice,
      behaviorFocus: job.behaviorFocus,
      parentNote: job.parentNote,
      classification: job.behaviorFocus,
    });
    return;
  }

  res.json(withAbsoluteUrls(job.story, `${req.protocol}://${req.get("host")}`));
});

export default router;

function withAbsoluteUrls(
  story: StorySheetGeneratedStory,
  origin: string,
): StorySheetGeneratedStory {
  const production = process.env.NODE_ENV === "production";
  const absolutize = (value?: string) =>
    value?.startsWith("/") ? `${origin}${value}` : value;
  const productionSafeUrl = (value?: string) => {
    if (production && value?.startsWith("/api/story-runs")) return undefined;
    return absolutize(value);
  };

  return {
    ...story,
    coverImageUrl: productionSafeUrl(story.coverImageUrl),
    endImageUrl: productionSafeUrl(story.endImageUrl),
    sheetImageUrl: productionSafeUrl(story.sheetImageUrl),
    artifactLinks: !production && story.artifactLinks
      ? {
          bookHtmlUrl: absolutize(story.artifactLinks.bookHtmlUrl),
          storyJsonUrl: absolutize(story.artifactLinks.storyJsonUrl),
          usageJsonUrl: absolutize(story.artifactLinks.usageJsonUrl),
        }
      : undefined,
    pages: story.pages.map((page) => ({
      ...page,
      imageUrl: productionSafeUrl(page.imageUrl),
    })),
  };
}
