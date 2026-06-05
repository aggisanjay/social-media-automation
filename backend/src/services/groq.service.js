import { Groq } from "groq-sdk";
import logger from "../utils/logger.js";

let groqClient = null;

const getGroqClient = () => {
  if (groqClient) return groqClient;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.startsWith("your_")) {
    logger.warn("GROQ_API_KEY is not defined or is a placeholder. AI Service will operate in simulation mode.");
    return null;
  }
  try {
    groqClient = new Groq({ apiKey });
    return groqClient;
  } catch (error) {
    logger.error(`Failed to initialize Groq client: ${error.message}`);
    return null;
  }
};

const generateMockResponse = async (prompt, tone) => {
  logger.info("Generating mock AI response (Simulation Mode)");
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
  const mockCaptions = {
    Professional: `🚀 Exciting updates! We are thrilled to share that our latest project is officially underway. Let's build the future together.`,
    Creative: `✨ Magic is in the air. We've been mixing science and art to cook up something special for you. Stay tuned! 🎨`,
    Funny: `Me: I will write this post in 5 minutes.\nAlso me: Spend 3 hours staring at a blank document.\nLuckily, we've got you covered! 😂`,
    Minimalist: `Simplicity is the ultimate sophistication. New launch coming soon.`,
    Excited: `OMG! We literally cannot keep this a secret any longer! The brand new release is LIVE! Check it out now! 🎉🎉`,
  };
  const content = mockCaptions[tone] || `Here is a custom generation for your prompt: "${prompt}" in a ${tone} tone.`;
  return {
    title: `${tone} Update`,
    content,
    hashtags: [`#${tone}`, "#SocialAutomation"],
    imagePrompt: `A professional representation of: ${prompt}`,
    imageKeywords: "office,workspace"
  };
};

export const generatePostContent = async (prompt, tone) => {
  if (process.env.NODE_ENV === "test") {
    return {
      title: "Mock Title",
      content: "Mock generated social post",
      hashtags: ["#Mock", "#Social"],
      imagePrompt: "Mock image prompt",
      imageKeywords: "mock,keywords"
    };
  }

  const client = getGroqClient();

  if (!client) {
    return generateMockResponse(prompt, tone);
  }

  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a social media content generator.
Generate a structured, engaging social media post, a descriptive image prompt, and a list of 2-3 relevant search keywords for a stock photo search based on the user request.
The tone of the post must be: ${tone}.

You must respond with ONLY a valid JSON object matching this schema:
{
  "title": "string",
  "content": "string",
  "hashtags": ["string"],
  "imagePrompt": "string",
  "imageKeywords": "string"
}

Ensure the content matches the specific topic asked (e.g. if it is a job hiring post, describe the role and call to action).
The imagePrompt should describe a professional graphic, illustration, or photograph that visually matches the social media post topic.
The imageKeywords should be a comma-separated list of 2-3 broad, standard search keywords that describe the key objects or setting of the post topic suitable for stock photo search (e.g., "office,meeting" for corporate posts, "code,developer" for tech posts, "analytics,chart" for business growth, etc.).`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    
    let title = "";
    if (result.title) {
      title = typeof result.title === "string" ? result.title.trim() : JSON.stringify(result.title);
    }

    let content = "";
    if (result.content) {
      content = typeof result.content === "string" ? result.content.trim() : JSON.stringify(result.content, null, 2);
    }
    
    let hashtags = [];
    if (Array.isArray(result.hashtags)) {
      hashtags = result.hashtags.map(h => typeof h === "string" ? h.trim() : JSON.stringify(h));
    }
    
    let imagePrompt = "";
    if (result.imagePrompt) {
      imagePrompt = typeof result.imagePrompt === "string" ? result.imagePrompt.trim() : JSON.stringify(result.imagePrompt);
    }

    let imageKeywords = "";
    if (result.imageKeywords) {
      imageKeywords = typeof result.imageKeywords === "string" ? result.imageKeywords.trim() : JSON.stringify(result.imageKeywords);
    }

    return { title, content, hashtags, imagePrompt, imageKeywords };
  } catch (error) {
    logger.error(`Groq API generation failed: ${error.message}`);
    logger.warn("Falling back to simulation mode due to API error.");
    return generateMockResponse(prompt, tone);
  }
};
