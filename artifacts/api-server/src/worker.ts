import { logger } from "./lib/logger";
import { assertProductionEnv } from "./config/productionEnv";

const intervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 1500);

assertProductionEnv();

logger.info({ intervalMs }, "Kahani generation worker started");

setInterval(() => {
  logger.debug("Worker poll tick");
}, intervalMs);
