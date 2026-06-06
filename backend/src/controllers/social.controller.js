import User from "../models/User.js";
import SocialAccount from "../models/SocialAccount.js";
import ActivityLog from "../models/ActivityLog.js";
import {
  createProfile,
  getConnectUrl,
  listAccounts,
  disconnectAccount as deleteZernioAccount
} from "../services/zernio.service.js";
import logger from "../utils/logger.js";

// Helper to ensure Zernio profile exists for a user
const ensureZernioProfile = async (user) => {
  if (user.zernioProfileId) {
    return user.zernioProfileId;
  }

  logger.info(`Creating Zernio profile workspace for user: ${user.name}`);
  const profile = await createProfile(user.name, `${user.name} Social Workspace`);
  
  user.zernioProfileId = profile._id || profile.id;
  await user.save();
  return user.zernioProfileId;
};

// 1. Connect Platform -> Generate Zernio OAuth URL
export const connectPlatform = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const zernioProfileId = await ensureZernioProfile(user);

    let frontendOrigin = req.get("origin") || req.get("referer") || process.env.FRONTEND_URL || "http://localhost:5173";
    try {
      const urlObj = new URL(frontendOrigin);
      frontendOrigin = urlObj.origin;
    } catch (e) {
      frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
    }

    const backendUrl = `${req.protocol}://${req.get("host")}`;
    const redirectUrl = `${backendUrl}/api/social/callback?profileId=${zernioProfileId}&frontendOrigin=${encodeURIComponent(frontendOrigin)}`;

    logger.info(`Requesting connection URL for platform ${platform} under profile ${zernioProfileId}`);
    const { authUrl } = await getConnectUrl(platform, zernioProfileId, redirectUrl);

    res.status(200).json({ authUrl });
  } catch (error) {
    next(error);
  }
};

// 2. GET /api/social/callback -> Handle Zernio callback
export const oauthCallback = async (req, res, next) => {
  try {
    const { profileId, frontendOrigin } = req.query;

    let targetOrigin = frontendOrigin || process.env.FRONTEND_URL || "http://localhost:5173";
    try {
      const urlObj = new URL(targetOrigin);
      targetOrigin = urlObj.origin;
    } catch (e) {
      targetOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
    }

    if (!profileId) {
      logger.warn("Callback reached without profileId parameter");
      return res.redirect(`${targetOrigin}/accounts`);
    }

    const user = await User.findOne({ zernioProfileId: profileId });
    if (!user) {
      logger.warn(`User matching zernioProfileId ${profileId} not found`);
      return res.redirect(`${targetOrigin}/accounts`);
    }

    // Fetch accounts to identify new ones linked to this profile workspace
    const { accounts } = await listAccounts();
    const matchingAccounts = accounts.filter(acc => {
      const accProfileId = acc.profileId?._id || acc.profileId;
      return accProfileId === profileId;
    });

    for (const acc of matchingAccounts) {
      const platformKey = (acc.platform || "").toLowerCase();
      const accountId = acc.id || acc._id;

      await SocialAccount.findOneAndUpdate(
        { userId: user._id, platform: platformKey, accountId: accountId },
        {
          name: acc.displayName || acc.username || "Connected Account",
          avatarUrl: acc.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${acc.displayName || acc.username}`,
          accessToken: "zernio_oauth_token",
          status: "connected",
          deletedAt: null
        },
        { upsert: true, new: true, withDeleted: true }
      );
    }

    await ActivityLog.create({
      userId: user._id,
      action: "connect",
      details: `Connected platform accounts under Zernio profile: ${profileId}`
    });

    res.redirect(`${targetOrigin}/accounts`);
  } catch (error) {
    next(error);
  }
};

// 3. GET /api/social/accounts -> Retrieve user accounts
export const getAccounts = async (req, res, next) => {
  try {
    const accounts = await SocialAccount.find({ userId: req.user.userId, status: "connected" });
    res.status(200).json({ accounts });
  } catch (error) {
    next(error);
  }
};

// 4. DELETE /api/social/accounts/:id -> Disconnect account
export const disconnectAccount = async (req, res, next) => {
  try {
    const account = await SocialAccount.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!account) {
      return res.status(404).json({ message: "Social account not found" });
    }

    // Delete from Zernio
    logger.info(`Disconnecting account ${account.accountId} on Zernio`);
    try {
      await deleteZernioAccount(account.accountId);
    } catch (zernioErr) {
      logger.warn(`Failed to delete account on Zernio: ${zernioErr.message}. Proceeding with local disconnect.`);
    }

    // Update status in MongoDB
    account.status = "disconnected";
    account.deletedAt = new Date();
    await account.save();

    await ActivityLog.create({
      userId: req.user.userId,
      action: "disconnect",
      details: `Disconnected account: ${account.name} (${account.platform})`
    });

    res.status(200).json({ message: "Social account disconnected successfully" });
  } catch (error) {
    next(error);
  }
};

// 5. POST /api/social/sync -> Force synchronize accounts list
export const syncAccounts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const zernioProfileId = await ensureZernioProfile(user);

    const { accounts } = await listAccounts();
    const matchingAccounts = accounts.filter(acc => {
      const accProfileId = acc.profileId?._id || acc.profileId;
      return accProfileId === zernioProfileId;
    });

    const activeAccountIds = matchingAccounts.map(acc => acc.id || acc._id);
    
    // Prune accounts locally that are disconnected on Zernio
    await SocialAccount.updateMany(
      { userId: user._id, accountId: { $nin: activeAccountIds } },
      { status: "disconnected", deletedAt: new Date() }
    );

    // Insert or update Zernio accounts
    const connectedAccounts = [];
    for (const acc of matchingAccounts) {
      const platformKey = (acc.platform || "").toLowerCase();
      const accountId = acc.id || acc._id;

      const updated = await SocialAccount.findOneAndUpdate(
        { userId: user._id, platform: platformKey, accountId: accountId },
        {
          name: acc.displayName || acc.username || "Connected Account",
          avatarUrl: acc.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${acc.displayName || acc.username}`,
          accessToken: "zernio_oauth_token",
          status: "connected",
          deletedAt: null
        },
        { upsert: true, new: true, withDeleted: true }
      );
      connectedAccounts.push(updated);
    }

    await ActivityLog.create({
      userId: user._id,
      action: "update_profile",
      details: "Synchronized social accounts with Zernio workspace"
    });

    res.status(200).json({ accounts: connectedAccounts });
  } catch (error) {
    next(error);
  }
};
