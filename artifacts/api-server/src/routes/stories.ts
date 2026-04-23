import { Router, type IRouter } from "express";
import { GenerateStoryBody } from "@workspace/api-zod";
import { getAiConfig } from "../services/book-generation/aiClient";
import { runBookPipeline } from "../services/book-generation/orchestrator";

const router: IRouter = Router();

router.post("/stories/generate", async (req, res) => {
  const config = getAiConfig();
  if (!config) {
    res.status(500).json({ message: "Story generation is not configured." });
    return;
  }

  try {
    const body = GenerateStoryBody.parse(req.body);
    const result = await runBookPipeline(body, config);
    res.json(result.story);
  } catch (error) {
    req.log.error({ err: error }, "Story pipeline failed");
    res.status(502).json({ message: "The story service could not generate a story." });
  }
});

export default router;
