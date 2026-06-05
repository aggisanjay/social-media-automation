import logger from "../utils/logger.js";
import { uploadMedia } from "./cloudinary.service.js";

/**
 * Generates an image using ClipDrop's Text to Image API.
 * Falls back to simulation mode (Pollinations.ai) if API key is missing or request fails.
 * 
 * @param {string} imagePrompt - The descriptive text prompt for the image.
 * @returns {Promise<string>} - The URL or Data URI of the generated image.
 */
export const generateImageFromPrompt = async (imagePrompt) => {
  const apiKey = process.env.CLIPDROP_API_KEY;

  const getFallbackUrl = (prompt) => {
    const enhancedPrompt = `${prompt}, professional social media banner, clean corporate style, high resolution`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=600&height=400&nologo=true`;
  };

  if (!apiKey || apiKey.startsWith("your_")) {
    logger.info("ClipDrop API key is not defined. Operating in simulation mode using Pollinations.");
    return getFallbackUrl(imagePrompt);
  }

  try {
    const enhancedPrompt = `${imagePrompt}, professional social media banner, clean corporate style, high resolution`;
    logger.info(`Generating image using ClipDrop API for prompt: "${imagePrompt.substring(0, 50)}..."`);

    const formData = new FormData();
    formData.append("prompt", enhancedPrompt);

    const response = await fetch("https://clipdrop-api.co/text-to-image/v1", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ClipDrop API returned status ${response.status}: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:image/png;base64,${base64Data}`;

    // Upload to Cloudinary to obtain a persistent public URL
    try {
      const uploadResult = await uploadMedia(dataUri);
      logger.info(`Successfully uploaded ClipDrop-generated image to Cloudinary: ${uploadResult.url}`);
      return uploadResult.url;
    } catch (uploadError) {
      logger.warn(`Failed to upload ClipDrop-generated image to Cloudinary: ${uploadError.message}. Returning data URI.`);
      return dataUri;
    }
  } catch (error) {
    logger.error(`ClipDrop Image generation failed: ${error.message}`);
    logger.warn("Falling back to Pollinations simulation mode due to ClipDrop API failure.");
    return getFallbackUrl(imagePrompt);
  }
};
