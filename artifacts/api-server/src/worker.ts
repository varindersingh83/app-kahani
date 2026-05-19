import { logger } from "./lib/logger";

const intervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 1500);

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for the production worker.");
}

logger.info({ intervalMs }, "Kahani generation worker started");

setInterval(() => {
  logger.debug("Worker poll tick");
}, intervalMs);
