import SocialAccount from "../models/SocialAccount.js";
import ActivityLog from "../models/ActivityLog.js";
import { fetchConnectedProfiles } from "../services/zernio.service.js";

export const getAccounts = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Clean up any malformed accounts (e.g. missing required platform or accountId)
    await SocialAccount.deleteMany({
      $or: [
        { platform: { $exists: false } },
        { platform: null },
        { accountId: { $exists: false } },
        { accountId: null },
        { platform: { $nin: ["linkedin", "twitter", "facebook", "instagram", "threads"] } },
        { accountId: { $not: /^(acc_[a-zA-Z0-9]+|[0-9a-fA-F]{24})$/ } }
      ]
    });

    // Synchronize with Zernio if credentials exist
    const zernioProfiles = await fetchConnectedProfiles();
    const supportedPlatforms = ["linkedin", "twitter", "facebook", "instagram", "threads"];
    for (const p of zernioProfiles) {
      if (!p.platform || !p.accountId || !supportedPlatforms.includes(p.platform)) {
        continue;
      }
      await SocialAccount.findOneAndUpdate(
        { userId, platform: p.platform, accountId: p.accountId },
        {
          name: p.name,
          avatarUrl: p.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}`,
          accessToken: "zernio_sync_token",
          status: "connected",
          deletedAt: null,
        },
        { upsert: true, new: true, withDeleted: true }
      );
    }

    const connectedAccounts = await SocialAccount.find({ userId });
    res.status(200).json({ accounts: connectedAccounts });
  } catch (error) {
    next(error);
  }
};

export const connectAccount = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { platform, name, accountId } = req.body;

    if (!platform || !name || !accountId) {
      return res.status(400).json({ message: "Platform, name, and accountId are required" });
    }

    // Upsert the social account
    const account = await SocialAccount.findOneAndUpdate(
      { userId, platform, accountId },
      {
        name,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
        accessToken: "simulated_access_token_12345",
        refreshToken: "simulated_refresh_token_12345",
        status: "connected",
        deletedAt: null, // Clear soft delete if reconnected
      },
      { new: true, upsert: true, runValidators: true, withDeleted: true }
    );

    await ActivityLog.create({
      userId,
      action: "connect",
      details: `Connected ${platform} account: ${name}`,
    });

    res.status(200).json({ message: "Social account connected successfully", account });
  } catch (error) {
    next(error);
  }
};

export const disconnectAccount = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const account = await SocialAccount.findOneAndUpdate(
      { _id: id, userId },
      { deletedAt: new Date(), status: "disconnected" },
      { new: true }
    );
    if (!account) {
      return res.status(404).json({ message: "Social account not found" });
    }

    await ActivityLog.create({
      userId,
      action: "disconnect",
      details: `Disconnected ${account.platform} account: ${account.name}`,
    });

    res.status(200).json({ message: "Social account disconnected successfully" });
  } catch (error) {
    next(error);
  }
};

export const syncAccount = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const account = await SocialAccount.findOne({ _id: id, userId });
    if (!account) {
      return res.status(404).json({ message: "Social account not found" });
    }

    account.status = "connected";
    await account.save();

    res.status(200).json({ message: "Social account synced successfully", account });
  } catch (error) {
    next(error);
  }
};
