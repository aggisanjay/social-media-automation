import { Queue } from "bullmq";
import IORedis from "ioredis";
import logger from "../utils/logger.js";
import Post from "../models/Post.js";
import { publishToPlatform } from "./zernio.service.js";
import SocialAccount from "../models/SocialAccount.js";
import ActivityLog from "../models/ActivityLog.js";

let postQueue = null;
let redisConnection = null;
let useFallbackScheduler = false;

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const initBullMQ = () => {
  try {
    const isTls = REDIS_URL.startsWith("rediss://");
    redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
      retryStrategy: () => null, // Stop reconnecting to keep console clean
      ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
    });

    redisConnection.on("error", (err) => {
      if (!useFallbackScheduler) {
        logger.warn(`Redis connection error: ${err.message}. Falling back to In-Memory Scheduler.`);
        useFallbackScheduler = true;
        startInMemoryScheduler();
      }
    });

    postQueue = new Queue("post-publishing", {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    logger.info("BullMQ post-publishing Queue initialized successfully.");
  } catch (error) {
    logger.warn(`Failed to initialize BullMQ: ${error.message}. Falling back to In-Memory Scheduler.`);
    useFallbackScheduler = true;
    startInMemoryScheduler();
  }
};

// In-Memory Fallback Scheduler
const startInMemoryScheduler = () => {
  logger.info("Starting In-Memory Fallback Scheduler (checks for due posts every 30 seconds)");
  setInterval(async () => {
    try {
      const now = new Date();
      const duePosts = await Post.find({
        status: "scheduled",
        scheduledAt: { $lte: now },
      });

      for (const post of duePosts) {
        logger.info(`Fallback Scheduler: Publishing post ${post._id}`);
        await executePublishPostJob(post._id);
      }
    } catch (error) {
      logger.error(`Error in Fallback Scheduler: ${error.message}`);
    }
  }, 30000);
};

export const schedulePost = async (post) => {
  if (!postQueue || useFallbackScheduler) {
    logger.info(`Post ${post._id} scheduled in DB (will be picked up by fallback scheduler)`);
    return;
  }

  try {
    const delay = new Date(post.scheduledAt).getTime() - Date.now();
    await postQueue.add(
      "publish-post",
      { postId: post._id },
      { delay: Math.max(0, delay), jobId: post._id.toString() }
    );
    logger.info(`Post ${post._id} added to BullMQ with delay of ${delay}ms`);
  } catch (error) {
    logger.error(`Failed to add post to BullMQ queue: ${error.message}`);
    // If BullMQ fails, it will still be picked up by fallback scheduler since status is 'scheduled' in DB
  }
};

export const cancelScheduledPost = async (postId) => {
  if (!postQueue || useFallbackScheduler) return;
  try {
    const job = await postQueue.getJob(postId.toString());
    if (job) {
      await job.remove();
      logger.info(`Canceled scheduled post job ${postId} in BullMQ`);
    }
  } catch (error) {
    logger.error(`Failed to cancel BullMQ job for post ${postId}: ${error.message}`);
  }
};

// Core publishing execution logic (reused by both BullMQ Worker and In-Memory Fallback)
export const executePublishPostJob = async (postId) => {
  const post = await Post.findById(postId);
  if (!post || post.status !== "scheduled") {
    logger.warn(`Job skipped: Post ${postId} not found or status is not 'scheduled'`);
    return;
  }

  logger.info(`Publishing post ${post._id} to platforms: ${post.platforms.join(", ")}`);
  
  try {
    // 1. Fetch connected social accounts for the user
    const accounts = await SocialAccount.find({ userId: post.userId, status: "connected" });
    
    // Map platform keys to their social accounts
    const platformToAccount = {};
    accounts.forEach((acc) => {
      // Map frontend platform keys: "x" -> "twitter", "li" -> "linkedin", etc.
      let key = acc.platform;
      if (acc.platform === "twitter") key = "x";
      if (acc.platform === "linkedin") key = "li";
      if (acc.platform === "facebook") key = "fb";
      if (acc.platform === "instagram") key = "ig";
      
      platformToAccount[key] = acc;
    });

    // 2. Publish to each platform
    const errors = [];
    for (const pfKey of post.platforms) {
      const account = platformToAccount[pfKey];
      if (!account) {
        errors.push(`No connected account for platform: ${pfKey}`);
        continue;
      }

      try {
        await publishToPlatform(account.platform, post.content, post.mediaUrl, {
          accessToken: account.accessToken,
        });
      } catch (err) {
        errors.push(`${account.platform}: ${err.message}`);
      }
    }

    if (errors.length === post.platforms.length) {
      // All platforms failed
      post.status = "failed";
      post.errorMessage = errors.join("; ");
      await post.save();
      logger.error(`Post ${post._id} publishing failed on all platforms: ${post.errorMessage}`);
    } else {
      post.status = "published";
      post.publishedAt = new Date();
      if (errors.length > 0) {
        post.errorMessage = `Partial success. Failures: ${errors.join("; ")}`;
      }
      await post.save();
      logger.info(`Post ${post._id} successfully published`);

      // Log activity
      await ActivityLog.create({
        userId: post.userId,
        action: "publish",
        details: `Published post to ${post.platforms.join(", ")}`,
      });
    }
  } catch (error) {
    post.status = "failed";
    post.errorMessage = error.message;
    await post.save();
    logger.error(`Failed executing job for post ${post._id}: ${error.message}`);
  }
};

// Initialize on service load
initBullMQ();
if (useFallbackScheduler) {
  startInMemoryScheduler();
}
