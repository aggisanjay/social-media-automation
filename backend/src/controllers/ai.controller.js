import AIGeneration from "../models/AIGeneration.js";
import ActivityLog from "../models/ActivityLog.js";
import { generatePostContent } from "../services/groq.service.js";
import { generateImageFromPrompt } from "../services/clipdrop.service.js";

export const generateContent = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { prompt, tone, generateImage } = req.body;

    if (!prompt || !tone) {
      return res.status(400).json({ message: "Prompt and tone are required" });
    }

    const { title, content, hashtags, imagePrompt, imageKeywords } = await generatePostContent(prompt, tone);
    
    // Clean text: strip out markdown bold double-asterisks (**)
    const cleanTitle = title ? title.replace(/\*\*/g, "").trim() : "";
    const cleanContent = content ? content.replace(/\*\*/g, "").trim() : "";
    
    // Format hashtags: ensure they all have a single '#' symbol prefix
    const cleanHashtagsList = hashtags && hashtags.length > 0 ? hashtags.map(h => {
      const trimmed = h.replace(/\*\*/g, "").trim();
      if (!trimmed) return "";
      return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    }).filter(Boolean) : [];

    let imageUrl = "";
    if (generateImage && imagePrompt) {
      imageUrl = await generateImageFromPrompt(imagePrompt);
    }

    const generation = await AIGeneration.create({
      userId,
      prompt,
      tone,
      title: cleanTitle,
      content: cleanContent,
      hashtags: cleanHashtagsList,
      imagePrompt,
      imageUrl,
    });

    const combinedText = [
      generation.title,
      generation.content,
      generation.hashtags.join(" ")
    ].filter(Boolean).join("\n\n");

    await ActivityLog.create({
      userId,
      action: "generate",
      details: `Generated ${tone} AI post: "${generation.title || generation.content.substring(0, 30)}..."`,
    });

    res.status(200).json({
      message: "AI Content generated successfully",
      generation: {
        id: generation._id,
        prompt: generation.prompt,
        tone: generation.tone,
        title: generation.title,
        content: generation.content,
        hashtags: generation.hashtags,
        imagePrompt: generation.imagePrompt,
        text: combinedText,
        img: generation.imageUrl,
        date: generation.createdAt.toLocaleDateString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const history = await AIGeneration.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      history: history.map((g) => {
        const combinedText = [
          g.title,
          g.content,
          g.hashtags && g.hashtags.length > 0 ? g.hashtags.join(" ") : ""
        ].filter(Boolean).join("\n\n");

        return {
          id: g._id,
          prompt: g.prompt,
          tone: g.tone,
          title: g.title || "",
          content: g.content || "",
          hashtags: g.hashtags || [],
          imagePrompt: g.imagePrompt || "",
          text: combinedText,
          img: g.imageUrl,
          date: g.createdAt.toLocaleDateString(),
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};
