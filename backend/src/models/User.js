import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    zernioProfileId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Soft delete query helpers
userSchema.pre(/^find/, function (next) {
  if (this.getOptions().withDeleted) {
    return next();
  }
  this.where({ deletedAt: null });
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
