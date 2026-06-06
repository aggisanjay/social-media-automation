import Post from "../models/Post.js";
import ActivityLog from "../models/ActivityLog.js";
import { schedulePost, cancelScheduledPost, executePublishPostJob } from "../services/scheduler.service.js";
import { uploadMedia } from "../services/cloudinary.service.js";
import logger from "../utils/logger.js";

export const createPost = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { platforms, content, scheduledAt, mediaUrl: bodyMediaUrl } = req.body;
    let mediaUrl = bodyMediaUrl || "";

    if (platforms === undefined || platforms === null || content === undefined || content === null) {
      return res.status(400).json({ message: "Platforms and content are required" });
    }

    if (typeof content !== "string") {
      return res.status(400).json({ message: "Content must be a string" });
    }

    let platformList;
    try {
      platformList = typeof platforms === "string" ? JSON.parse(platforms) : platforms;
    } catch (e) {
      return res.status(400).json({ message: "Platforms must be a valid JSON array or list" });
    }

    if (!Array.isArray(platformList)) {
      return res.status(400).json({ message: "Platforms must be an array" });
    }

    if (platformList.length === 0) {
      return res.status(400).json({ message: "At least one platform must be selected" });
    }

    if (bodyMediaUrl !== undefined && bodyMediaUrl !== null && typeof bodyMediaUrl !== "string") {
      return res.status(400).json({ message: "Media URL must be a string" });
    }

    if (req.file) {
      const uploadResult = await uploadMedia(req.file.path);
      mediaUrl = uploadResult.url;
    }

    // Add debug log before database save: content type and content length
    logger.info(`Before database save: content type = ${typeof content}, content length = ${content.length}`);

    const postStatus = scheduledAt ? "scheduled" : "draft";

    const post = await Post.create({
      userId,
      platforms: platformList,
      content,
      mediaUrl,
      status: postStatus,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    });

    if (post.status === "scheduled") {
      await schedulePost(post);
      await ActivityLog.create({
        userId,
        action: "schedule",
        details: `Scheduled post for ${post.platforms.join(", ")}`,
      });
    } else {
      // If no scheduled time, publish immediately
      post.status = "scheduled"; // Need status 'scheduled' for executePublishPostJob to pick it up
      await post.save();
      await executePublishPostJob(post._id);
    }

    const updatedPost = await Post.findById(post._id);
    res.status(201).json({ message: "Post created successfully", post: updatedPost });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingPosts = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const posts = await Post.find({ userId, status: "scheduled" }).sort({ scheduledAt: 1 });
    res.status(200).json({ posts });
  } catch (error) {
    next(error);
  }
};

export const getPublishedPosts = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const posts = await Post.find({ userId, status: { $in: ["published", "failed"] } }).sort({ updatedAt: -1 });
    res.status(200).json({ posts });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { platforms, content, scheduledAt } = req.body;

    const post = await Post.findOne({ _id: id, userId });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (req.file) {
      const uploadResult = await uploadMedia(req.file.path);
      post.mediaUrl = uploadResult.url;
    }

    if (content !== undefined && content !== null) {
      if (typeof content !== "string") {
        return res.status(400).json({ message: "Content must be a string" });
      }
      post.content = content;
    }

    if (platforms !== undefined && platforms !== null) {
      let platformList;
      try {
        platformList = typeof platforms === "string" ? JSON.parse(platforms) : platforms;
      } catch (e) {
        return res.status(400).json({ message: "Platforms must be a valid JSON array or list" });
      }
      if (!Array.isArray(platformList)) {
        return res.status(400).json({ message: "Platforms must be an array" });
      }
      if (platformList.length === 0) {
        return res.status(400).json({ message: "At least one platform must be selected" });
      }
      post.platforms = platformList;
    }

    // Add debug log before database save: content type and content length
    logger.info(`Before database save (update): content type = ${typeof post.content}, content length = ${post.content ? post.content.length : 0}`);

    const scheduleDateChanged = scheduledAt && new Date(scheduledAt).getTime() !== new Date(post.scheduledAt).getTime();
    if (scheduledAt) {
      post.scheduledAt = new Date(scheduledAt);
      if (post.status === "scheduled" && scheduleDateChanged) {
        await cancelScheduledPost(post._id);
        await schedulePost(post);
      }
    }

    await post.save();
    res.status(200).json({ message: "Post updated successfully", post });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const post = await Post.findOne({ _id: id, userId });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.status === "scheduled") {
      await cancelScheduledPost(post._id);
    }

    post.deletedAt = new Date();
    await post.save();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const publishImmediately = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const post = await Post.findOne({ _id: id, userId });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.status === "scheduled") {
      await cancelScheduledPost(post._id);
    }

    post.status = "scheduled";
    post.scheduledAt = new Date();
    await post.save();

    await executePublishPostJob(post._id);

    const updatedPost = await Post.findById(post._id);
    res.status(200).json({ message: "Post publishing triggered immediately", post: updatedPost });
  } catch (error) {
    next(error);
  }
};
