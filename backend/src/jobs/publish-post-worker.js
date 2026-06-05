import { Worker } from "bullmq";
import IORedis from "ioredis";
import logger from "../utils/logger.js";
import { executePublishPostJob } from "../services/scheduler.service.js";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let worker = null;

export const startWorker = () => {
  try {
    const isTls = REDIS_URL.startsWith("rediss://");
    const connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
      retryStrategy: () => null, // Stop reconnecting to keep console clean
      ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
    });

    connection.on("error", (err) => {
      // Worker connection failed, rely on scheduler's log and fallback
    });

    worker = new Worker(
      "post-publishing",
      async (job) => {
        logger.info(`Worker processing job ${job.id} for post ${job.data.postId}`);
        await executePublishPostJob(job.data.postId);
      },
      {
        connection,
        concurrency: 5,
      }
    );

    worker.on("completed", (job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    worker.on("failed", (job, err) => {
      logger.error(`Job ${job?.id} failed: ${err.message}`);
    });

    logger.info("BullMQ publish-post-worker started.");
  } catch (error) {
    logger.warn(`Could not start BullMQ worker: ${error.message}. Scheduler fallback will handle scheduled jobs.`);
  }
};
