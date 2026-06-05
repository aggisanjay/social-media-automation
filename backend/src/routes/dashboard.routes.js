import express from "express";
import { getStats, getActivity } from "../controllers/dashboard.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/stats", protect, getStats);
router.get("/activity", protect, getActivity);

export default router;
