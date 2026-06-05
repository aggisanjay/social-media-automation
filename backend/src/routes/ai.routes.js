import express from "express";
import { generateContent, getHistory } from "../controllers/ai.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect); // All AI routes are protected

router.post("/generate", generateContent);
router.get("/history", getHistory);

export default router;
