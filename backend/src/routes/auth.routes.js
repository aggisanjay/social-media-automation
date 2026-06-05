import express from "express";
import { register, login, logout, refresh, getProfile, updateProfile, deleteAccount } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.post("/refresh", refresh);
router.get("/me", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.delete("/account", protect, deleteAccount);

export default router;
