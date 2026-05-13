import { Router, type IRouter } from "express";
import { GenerateStoryBody } from "@workspace/api-zod";
import { getAiConfig } from "../services/story-sheet/aiClient";
import {
  readStorySheetJob,
  startStorySheetJob,
} from "../services/story-sheet/jobs";
import {
  GUARDRAIL_REWRITE_MESSAGE,
  sanitizedGuardrailLog,
  scanStoryRequest,
} from "../services/guardrails";

const router: IRouter = Router();
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.post("/books", async (req, res) => {
  try {
    const body = GenerateStoryBody.parse(req.body);
    const guardrail = scanStoryRequest(body);
    if (guardrail.result.verdict !== "allow") {
      req.log.warn(
        { guardrail: sanitizedGuardrailLog(guardrail) },
        "Book generation rejected by prompt guardrail",
      );
      res.status(400).json({ message: GUARDRAIL_REWRITE_MESSAGE });
      return;
    }

    const config = getAiConfig();
    if (!config) {
      res.status(503).json({ message: "Book generation is not configured." });
      return;
    }

    const job = await startStorySheetJob(body, config);
    res.status(202).json({
      bookId: job.bookId,
      status: job.status,
      step: job.step,
      message: job.message,
    });
  } catch (error) {
    req.log.error({ err: error }, "Book job could not start");
    res.status(400).json({ message: "The book request is invalid." });
  }
});

router.get("/books/qa", async (_req, res) => {
  res.json({ items: [] });
});

router.get("/books/:bookId", async (req, res) => {
  const bookId = parseBookId(req.params.bookId);
  if (!bookId) {
    res.status(400).json({ message: "Invalid book id." });
    return;
  }

  const job = await readStorySheetJob(bookId);
  if (!job) {
    res.status(404).json({ message: "Book not found." });
    return;
  }

  res.json(job);
});

router.get("/books/:bookId/pages", async (req, res) => {
  const bookId = parseBookId(req.params.bookId);
  if (!bookId) {
    res.status(400).json({ message: "Invalid book id." });
    return;
  }

  const job = await readStorySheetJob(bookId);
  if (!job) {
    res.status(404).json({ message: "Book not found." });
    return;
  }

  res.json({ items: job.story?.pages ?? [] });
});

router.get("/books/:bookId/events", async (req, res) => {
  const bookId = parseBookId(req.params.bookId);
  if (!bookId) {
    res.status(400).json({ message: "Invalid book id." });
    return;
  }

  const job = await readStorySheetJob(bookId);
  if (!job) {
    res.status(404).json({ message: "Book not found." });
    return;
  }

  res.json({
    items: [
      {
        bookId: job.bookId,
        eventType: job.step,
        message: job.message,
        error: job.error,
        createdAt: job.updatedAt,
      },
    ],
  });
});

export default router;

function parseBookId(value: unknown) {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : null;
}
