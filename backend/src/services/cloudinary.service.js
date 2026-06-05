import { v2 as cloudinary } from "cloudinary";
import logger from "../utils/logger.js";
import fs from "fs";

let cloudinaryConfigured = false;

const configureCloudinary = () => {
  if (cloudinaryConfigured) return true;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    logger.warn("Cloudinary credentials are not defined. Upload service will return local mock URLs.");
    return false;
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    cloudinaryConfigured = true;
    return true;
  } catch (error) {
    logger.error(`Failed to configure Cloudinary: ${error.message}`);
    return false;
  }
};

export const uploadMedia = async (filePath) => {
  const isConfigured = configureCloudinary();

  if (!isConfigured) {
    logger.info(`Simulating media upload for path: ${filePath}`);
    // If it's a remote URL (like Pollinations), return it directly
    if (filePath.startsWith("http")) {
      return { url: filePath, publicId: "remote_url" };
    }
    // Return a random beautiful Unsplash image to make it look premium
    const randomImages = [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
      "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80"
    ];
    const mockUrl = randomImages[Math.floor(Math.random() * randomImages.length)];
    return { url: mockUrl, publicId: "mock_id" };
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "social_media_automation",
    });
    // Remove local temp file only if it is a local path
    if (!filePath.startsWith("http") && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    if (error.message.includes("402") || error.message.includes("Payment Required")) {
      logger.warn(`Cloudinary upload skipped: Account limit reached (402 Payment Required).`);
    } else {
      logger.error(`Cloudinary upload failed: ${error.message}`);
    }
    throw new Error(`Media upload failed: ${error.message}`);
  }
};
