import mongoose from "mongoose";

const socialAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    platform: {
      type: String,
      enum: ["linkedin", "twitter", "facebook", "instagram", "threads"],
      required: true,
    },
    accountId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    status: {
      type: String,
      enum: ["connected", "disconnected", "expired"],
      default: "connected",
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
socialAccountSchema.index({ userId: 1, platform: 1, accountId: 1 }, { unique: true });

// Soft delete query helper
socialAccountSchema.pre(/^find/, function (next) {
  if (this.getOptions().withDeleted) {
    return next();
  }
  this.where({ deletedAt: null });
  next();
});

const SocialAccount = mongoose.model("SocialAccount", socialAccountSchema);

export default SocialAccount;
