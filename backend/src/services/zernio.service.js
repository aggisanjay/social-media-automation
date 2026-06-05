import logger from "../utils/logger.js";

export const publishToPlatform = async (platform, content, mediaUrl, credentials) => {
  const apiKey = process.env.ZERNIO_API_KEY;

  if (!apiKey) {
    logger.info(`ZERNIO SIMULATOR: Publishing to ${platform}...`);
    logger.info(`Content: "${content}"`);
    if (mediaUrl) logger.info(`Media: ${mediaUrl}`);
    
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    logger.info(`ZERNIO SIMULATOR: Successfully published to ${platform}!`);
    return {
      success: true,
      postId: `simulated_${platform}_${Date.now()}`,
      url: `https://${platform}.com/simulated_post_url`,
    };
  }

  try {
    logger.info(`Zernio API: Publishing to ${platform}...`);
    const response = await fetch("https://api.zernio.com/v1/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        platform,
        content,
        mediaUrl,
        credentials
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Zernio API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    logger.info(`Zernio API: Successfully published to ${platform}. Post ID: ${data.postId || data.id}`);
    return data;
  } catch (error) {
    logger.error(`Zernio publishing failed: ${error.message}`);
    throw new Error(`Social publishing failed: ${error.message}`);
  }
};

export const fetchConnectedProfiles = async () => {
  const apiKey = process.env.ZERNIO_API_KEY;
  if (!apiKey) {
    logger.warn("ZERNIO_API_KEY is not defined. Skipping profile sync.");
    return [];
  }

  try {
    const response = await fetch("https://zernio.com/api/v1/accounts", {
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Zernio API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const accounts = data.accounts || [];
    
    return accounts.map((acc) => ({
      accountId: acc.platformUserId || acc._id,
      name: acc.displayName || acc.username || "Zernio Account",
      platform: (acc.platform || "").toLowerCase(),
      avatarUrl: acc.profilePicture || "",
    }));
  } catch (error) {
    logger.error(`Failed to fetch connected profiles from Zernio: ${error.message}`);
    return [];
  }
};
