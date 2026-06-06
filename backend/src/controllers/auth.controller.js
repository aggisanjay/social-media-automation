import bcrypt from "bcryptjs";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/token.js";
import logger from "../utils/logger.js";
import { createProfile } from "../services/zernio.service.js";

// Helper to set refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let zernioProfileId = null;
    try {
      logger.info(`Creating initial Zernio profile workspace for new user: ${name}`);
      const profile = await createProfile(name, `${name} Social Workspace`);
      zernioProfileId = profile._id || profile.id;
    } catch (zernioError) {
      logger.error(`Failed to create Zernio profile during registration: ${zernioError.message}`);
    }

    const user = await User.create({
      name,
      email,
      passwordHash,
      zernioProfileId
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    setRefreshTokenCookie(res, refreshToken);

    await ActivityLog.create({
      userId: user._id,
      action: "login",
      details: "Registered and logged in first time",
    });

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    setRefreshTokenCookie(res, refreshToken);

    await ActivityLog.create({
      userId: user._id,
      action: "login",
      details: "Logged in successfully",
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await ActivityLog.create({
        userId: req.user.userId,
        action: "logout",
        details: "Logged out",
      });
    }

    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const accessToken = generateAccessToken(user);
    res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    await ActivityLog.create({
      userId: req.user.userId,
      action: "update_profile",
      details: "Updated user profile details",
    });

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.deletedAt = new Date();
    await user.save();

    await ActivityLog.create({
      userId: req.user.userId,
      action: "delete_account",
      details: "Soft deleted user account",
    });

    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};
