import mongoose from "mongoose";

const aiGenerationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    tone: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
    },
    hashtags: {
      type: [String],
      default: [],
    },
    imagePrompt: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
aiGenerationSchema.index({ userId: 1 });

const AIGeneration = mongoose.model("AIGeneration", aiGenerationSchema);

export default AIGeneration;
