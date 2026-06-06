import mongoose from "mongoose";
import logger from "../utils/logger.js";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    platforms: {
      type: [String],
      enum: ["x", "li", "fb", "ig", "threads"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "failed"],
      default: "draft",
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: "",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
postSchema.index({ userId: 1 });
postSchema.index({ status: 1 });
postSchema.index({ scheduledAt: 1 });

// Pre-save hook to log content type and length before database save
postSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    logger.info(`Before DB Save: content type = ${typeof this.content}, content length = ${this.content ? this.content.length : 0}`);
  }
  next();
});

// Soft delete query helper
postSchema.pre(/^find/, function (next) {
  if (this.getOptions().withDeleted) {
     return next();
  }
  this.where({ deletedAt: null });
  next();
});

const Post = mongoose.model("Post", postSchema);

export default Post;
