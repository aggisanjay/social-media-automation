import Post from "../models/Post.js";
import SocialAccount from "../models/SocialAccount.js";
import ActivityLog from "../models/ActivityLog.js";

export const getStats = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const scheduledCount = await Post.countDocuments({ userId, status: "scheduled" });
    const publishedCount = await Post.countDocuments({ userId, status: "published" });
    const accountsCount = await SocialAccount.countDocuments({ userId, status: "connected" });

    res.status(200).json({
      stats: {
        scheduled: scheduledCount,
        published: publishedCount,
        accounts: accountsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getActivity = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const logs = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      activity: logs.map((log) => ({
        id: log._id,
        action: log.action,
        what: log.details,
        when: log.createdAt.toLocaleString(),
      })),
    });
  } catch (error) {
    next(error);
  }
};
