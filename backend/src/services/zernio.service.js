import Zernio from '@zernio/node';
import logger from "../utils/logger.js";

let zernioInstance = null;

export const getZernioClient = () => {
  if (!zernioInstance) {
    const apiKey = process.env.ZERNIO_API_KEY;
    zernioInstance = new Zernio({
      apiKey: apiKey || 'dummy_key'
    });
  }
  return zernioInstance;
};

export const zernio = new Proxy({}, {
  get(target, prop) {
    return getZernioClient()[prop];
  }
});

export const createProfile = async (name, description) => {
  try {
    const profile = await getZernioClient().profiles.createProfile({
      body: {
        name,
        description
      }
    });
    return profile.data || profile;
  } catch (error) {
    logger.warn(`Zernio createProfile failed: ${error.message}. Attempting to list existing profiles...`);
    try {
      const res = await getZernioClient().profiles.listProfiles();
      const data = res.data || res;
      const profiles = data?.profiles || [];
      if (profiles.length > 0) {
        const defaultProfile = profiles.find((p) => p.isDefault) || profiles[0];
        logger.info(`Fallback Zernio profile found: ${defaultProfile.name} (${defaultProfile._id || defaultProfile.id})`);
        return defaultProfile;
      }
    } catch (listError) {
      logger.error(`Zernio listProfiles fallback failed: ${listError.message}`);
    }
    throw error;
  }
};

export const getConnectUrl = async (platform, profileId, redirectUrl) => {
  try {
    const res = await getZernioClient().connect.getConnectUrl({
      path: {
        platform
      },
      query: {
        profileId,
        redirect_url: redirectUrl
      }
    });
    return res.data || res;
  } catch (error) {
    logger.error(`Zernio: getConnectUrl failed: ${error.message}`);
    throw error;
  }
};

export const listAccounts = async () => {
  try {
    const res = await getZernioClient().accounts.listAccounts();
    const data = res.data || res;
    const accounts = data?.accounts || (Array.isArray(data) ? data : []);
    return { accounts };
  } catch (error) {
    logger.error(`Zernio: listAccounts failed: ${error.message}`);
    throw error;
  }
};

export const disconnectAccount = async (id) => {
  try {
    const res = await getZernioClient().accounts.deleteAccount({
      path: {
        accountId: id
      }
    });
    return res.data || res;
  } catch (error) {
    logger.error(`Zernio: deleteAccount failed: ${error.message}`);
    throw error;
  }
};

export const fetchConnectedProfiles = async () => {
  try {
    const { accounts } = await listAccounts();
    return accounts.map(acc => ({
      accountId: acc.id || acc._id,
      name: acc.displayName || acc.username || "Zernio Account",
      platform: (acc.platform || "").toLowerCase(),
      avatarUrl: acc.profilePicture || ""
    }));
  } catch (error) {
    logger.error(`Failed to fetch connected profiles from Zernio: ${error.message}`);
    return [];
  }
};

export const publishToPlatform = async (platform, content, mediaUrl, credentials) => {
  const accountId = credentials?.accountId;
  const scheduledFor = credentials?.scheduledFor;

  const payload = {
    content,
    platforms: [
      {
        platform,
        accountId
      }
    ]
  };

  if (scheduledFor) {
    payload.scheduledFor = scheduledFor;
  } else {
    payload.publishNow = true;
  }

  if (mediaUrl) {
    const isVideo = mediaUrl.match(/\.(mp4|mov|avi|mkv|webm)(?:\?.*)?$/i);
    payload.mediaItems = [
      {
        type: isVideo ? "video" : "image",
        url: mediaUrl
      }
    ];
  }

  const url = "https://zernio.com/api/v1/posts";
  
  try {
    const res = await getZernioClient().posts.createPost({
      body: payload
    });
    const responseData = res.data || res;
    const response = { data: responseData };

    console.log("Zernio URL:", url);
    console.log("Payload:", payload);
    console.log("Response:", response.data);

    logger.info(`Zernio API: Successfully published to ${platform}. Post ID: ${responseData.post?._id || responseData.postId || responseData.id}`);
    return responseData;
  } catch (error) {
    logger.error(`Zernio publishing failed: ${error.message}`);
    throw new Error(`Social publishing failed: ${error.message}`);
  }
};
