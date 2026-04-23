import { Router, type IRouter } from "express";
import { CreateBookBody } from "@workspace/api-zod";
import { getAiConfig } from "../services/book-generation/aiClient";
import {
  readBookEvents,
  readBookPages,
  readBookStatus,
  readQaQueue,
  runBookPipeline,
} from "../services/book-generation/orchestrator";

const router: IRouter = Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.post("/books", async (req, res) => {
  const config = getAiConfig();
  if (!config) {
    res.status(500).json({ message: "Book generation is not configured." });
    return;
  }

  try {
    const body = CreateBookBody.parse(req.body);
    const result = await runBookPipeline(body, config);
    res.status(201).json(result);
  } catch (error) {
    req.log.error({ err: error }, "Book pipeline failed");
    res.status(502).json({ message: "The book service could not generate a book." });
  }
});

router.get("/books/qa", async (_req, res) => {
  res.json({ items: await readQaQueue() });
});

router.get("/books/:bookId", async (req, res) => {
  const bookId = parseBookId(req.params.bookId);
  if (!bookId) {
    res.status(400).json({ message: "Invalid book id." });
    return;
  }
  const status = await readBookStatus(bookId);
  if (!status) {
    res.status(404).json({ message: "Book not found." });
    return;
  }
  res.json(status);
});

router.get("/books/:bookId/pages", async (req, res) => {
  const bookId = parseBookId(req.params.bookId);
  if (!bookId) {
    res.status(400).json({ message: "Invalid book id." });
    return;
  }
  const pages = await readBookPages(bookId);
  if (!pages) {
    res.status(404).json({ message: "Book not found." });
    return;
  }
  res.json({ items: pages });
});

router.get("/books/:bookId/events", async (req, res) => {
  const bookId = parseBookId(req.params.bookId);
  if (!bookId) {
    res.status(400).json({ message: "Invalid book id." });
    return;
  }
  const status = await readBookStatus(bookId);
  if (!status) {
    res.status(404).json({ message: "Book not found." });
    return;
  }
  res.json({ items: await readBookEvents(bookId) });
});

export default router;

function parseBookId(value: unknown) {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : null;
}
