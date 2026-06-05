import Post from "../models/Post.js";
import ActivityLog from "../models/ActivityLog.js";
import { schedulePost, cancelScheduledPost, executePublishPostJob } from "../services/scheduler.service.js";
import { uploadMedia } from "../services/cloudinary.service.js";

export const createPost = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { platforms, content, scheduledAt, mediaUrl: bodyMediaUrl } = req.body;
    let mediaUrl = bodyMediaUrl || "";

    if (!platforms || !content) {
      return res.status(400).json({ message: "Platforms and content are required" });
    }

    const platformList = typeof platforms === "string" ? JSON.parse(platforms) : platforms;

    if (req.file) {
      const uploadResult = await uploadMedia(req.file.path);
      mediaUrl = uploadResult.url;
    }

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

    if (platforms) post.platforms = typeof platforms === "string" ? JSON.parse(platforms) : platforms;
    if (content) post.content = content;

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
